// Force-field extras for RDKit MinimalLib (MMFF94 / UFF / ETKDGv3).
// Adapted from Molarium's MinimalLib bridge (Apache-2.0). Molecular
// potentials and analytical gradients are RDKit's (BSD-3).
// Public Embind names are snake_case MinimalLib ABI, not molarium_*.
//
// Both entry points follow MinimalLib conventions: options are passed as a
// JSON details string, and failures are logged to rdApp.error with an empty
// string returned.

#include "minilib.h"

#include <ForceField/ForceField.h>
#include <Geometry/point.h>
#include <GraphMol/DistGeomHelpers/Embedder.h>
#include <GraphMol/ForceFieldHelpers/MMFF/AtomTyper.h>
#include <GraphMol/ForceFieldHelpers/MMFF/Builder.h>
#include <GraphMol/ForceFieldHelpers/UFF/AtomTyper.h>
#include <GraphMol/ForceFieldHelpers/UFF/Builder.h>
#include <GraphMol/Trajectory/Trajectory.h>
#include <RDGeneral/RDLog.h>

#include <boost/json.hpp>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

namespace bj = boost::json;

namespace {

struct ParameterizedField {
  std::unique_ptr<ForceFields::ForceField> field;
  std::string name;
  bool fallback = false;
};

ParameterizedField parameterize(RDKit::RWMol &mol, int conformerId = -1) {
  auto properties =
      std::make_unique<RDKit::MMFF::MMFFMolProperties>(mol, "MMFF94");
  if (properties->isValid()) {
    std::unique_ptr<ForceFields::ForceField> field(
        RDKit::MMFF::constructForceField(mol, properties.get(), 100.0,
                                         conformerId, false));
    if (field) {
      field->initialize();
      return {std::move(field), "MMFF94", false};
    }
  }

  auto atomTypes = RDKit::UFF::getAtomTypes(mol);
  if (!atomTypes.second) {
    throw std::runtime_error(
        "Neither MMFF94 nor UFF has parameters for this molecule");
  }
  std::unique_ptr<ForceFields::ForceField> field(RDKit::UFF::constructForceField(
      mol, atomTypes.first, 100.0, conformerId, false));
  if (!field) {
    throw std::runtime_error("UFF could not construct a force field");
  }
  field->initialize();
  return {std::move(field), "UFF", true};
}

std::vector<double> conformerPositions(const RDKit::ROMol &mol,
                                       int conformerId = -1) {
  if (!mol.getNumConformers()) {
    throw std::runtime_error("The molecule has no conformer");
  }
  const auto &conformer = mol.getConformer(conformerId);
  std::vector<double> positions(mol.getNumAtoms() * 3);
  for (unsigned int atom = 0; atom < mol.getNumAtoms(); ++atom) {
    const auto &point = conformer.getAtomPos(atom);
    positions[atom * 3] = point.x;
    positions[atom * 3 + 1] = point.y;
    positions[atom * 3 + 2] = point.z;
  }
  return positions;
}

std::vector<double> snapshotPositions(const RDKit::Snapshot &snapshot,
                                      unsigned int atomCount) {
  std::vector<double> positions(atomCount * 3);
  for (unsigned int atom = 0; atom < atomCount; ++atom) {
    const auto point = snapshot.getPoint3D(atom);
    positions[atom * 3] = point.x;
    positions[atom * 3 + 1] = point.y;
    positions[atom * 3 + 2] = point.z;
  }
  return positions;
}

bool finitePositions(const std::vector<double> &positions) {
  return std::all_of(positions.begin(), positions.end(),
                     [](double value) { return std::isfinite(value); });
}

bj::array positionsArray(const std::vector<double> &positions) {
  bj::array coordinates;
  coordinates.reserve(positions.size());
  for (double value : positions) {
    coordinates.push_back(value);
  }
  return coordinates;
}

void addFrame(bj::array &frames, double energy,
              const std::vector<double> &positions) {
  bj::object frame;
  frame["energy"] = energy;
  frame["positions"] = positionsArray(positions);
  frames.push_back(std::move(frame));
}

// -- details parsing --------------------------------------------------------

bj::object parseDetails(const std::string &details) {
  if (details.empty()) {
    return {};
  }
  boost::system::error_code ec;
  auto parsed = bj::parse(details, ec);
  if (ec) {
    throw std::invalid_argument("details is not valid JSON");
  }
  if (!parsed.is_object()) {
    throw std::invalid_argument("details must be a JSON object");
  }
  return std::move(parsed.as_object());
}

std::int64_t asInteger(const bj::value &value, const std::string &key) {
  if (value.is_int64()) {
    return value.as_int64();
  }
  if (value.is_uint64() &&
      value.as_uint64() <= static_cast<std::uint64_t>(
                               std::numeric_limits<std::int64_t>::max())) {
    return static_cast<std::int64_t>(value.as_uint64());
  }
  if (value.is_double()) {
    const double number = value.as_double();
    if (std::isfinite(number) && std::trunc(number) == number &&
        std::fabs(number) <= 9.0e15) {
      return static_cast<std::int64_t>(number);
    }
  }
  throw std::invalid_argument(key + " must be an integer");
}

unsigned int getCount(const bj::object &options, const char *key,
                      unsigned int defaultValue) {
  const auto *value = options.if_contains(key);
  if (!value) {
    return defaultValue;
  }
  const auto integer = asInteger(*value, key);
  if (integer < 0 || integer > std::numeric_limits<unsigned int>::max()) {
    throw std::invalid_argument(std::string(key) +
                                " must be a non-negative integer");
  }
  return static_cast<unsigned int>(integer);
}

int getSeed(const bj::object &options, const char *key, int defaultValue) {
  const auto *value = options.if_contains(key);
  if (!value) {
    return defaultValue;
  }
  const auto integer = asInteger(*value, key);
  if (integer < -1 || integer > std::numeric_limits<int>::max()) {
    throw std::invalid_argument(std::string(key) +
                                " must be -1 or a non-negative integer");
  }
  return static_cast<int>(integer);
}

double getNumber(const bj::object &options, const char *key,
                 double defaultValue) {
  const auto *value = options.if_contains(key);
  if (!value) {
    return defaultValue;
  }
  double number = std::numeric_limits<double>::quiet_NaN();
  if (value->is_double()) {
    number = value->as_double();
  } else if (value->is_int64()) {
    number = static_cast<double>(value->as_int64());
  } else if (value->is_uint64()) {
    number = static_cast<double>(value->as_uint64());
  }
  if (!std::isfinite(number)) {
    throw std::invalid_argument(std::string(key) + " must be a finite number");
  }
  return number;
}

std::vector<unsigned int> getAtomIndices(const bj::object &options,
                                         const char *key,
                                         unsigned int atomCount) {
  const auto *value = options.if_contains(key);
  if (!value) {
    return {};
  }
  if (!value->is_array()) {
    throw std::invalid_argument(std::string(key) +
                                " must be an array of atom indices");
  }
  std::set<unsigned int> unique;
  for (const auto &item : value->as_array()) {
    const auto index = asInteger(item, key);
    if (index < 0 || index >= atomCount) {
      throw std::invalid_argument(std::string(key) +
                                  " contains an out-of-range atom index: " +
                                  std::to_string(index));
    }
    unique.insert(static_cast<unsigned int>(index));
  }
  return {unique.begin(), unique.end()};
}

std::string getJob(const bj::object &options) {
  const auto *value = options.if_contains("job");
  if (value && value->is_string()) {
    std::string job(value->as_string());
    if (job == "energy" || job == "minimize") {
      return job;
    }
  }
  throw std::invalid_argument(R"(job must be "energy" or "minimize")");
}

std::string logFailure(const char *function, const char *message) {
  BOOST_LOG(rdErrorLog) << function << ": " << message << std::endl;
  return "";
}

// -- jobs -------------------------------------------------------------------

std::string forceFieldEnergy(RDKit::RWMol &mol) {
  auto parameterized = parameterize(mol);
  auto positions = conformerPositions(mol);
  const double energy = parameterized.field->calcEnergy(positions.data());
  if (!std::isfinite(energy)) {
    throw std::runtime_error("The force-field energy is not finite");
  }
  bj::object result;
  result["forcefield"] = parameterized.name;
  result["fallback"] = parameterized.fallback;
  result["energy"] = energy;
  return bj::serialize(result);
}

std::string minimize(RDKit::RWMol &mol, const bj::object &options) {
  const auto maxIterations = getCount(options, "maxIterations", 200);
  const auto snapshotFrequency = getCount(options, "snapshotFrequency", 0);
  const auto fixedAtoms =
      getAtomIndices(options, "fixedAtoms", mol.getNumAtoms());
  if (!fixedAtoms.empty() && fixedAtoms.size() >= mol.getNumAtoms()) {
    throw std::invalid_argument(
        "Minimization requires at least one atom that is not fixed");
  }

  auto parameterized = parameterize(mol);
  for (const auto atom : fixedAtoms) {
    parameterized.field->fixedPoints().push_back(atom);
  }
  auto positions = conformerPositions(mol);
  const double initialEnergy =
      parameterized.field->calcEnergy(positions.data());
  if (!std::isfinite(initialEnergy)) {
    throw std::runtime_error("The starting force-field energy is not finite");
  }

  bj::array frames;
  addFrame(frames, initialEnergy, positions);

  // BFGS stores a snapshot every snapshotFrequency iterations and one more
  // when it converges. The trajectory takes ownership of the vector.
  auto *snapshots = new RDKit::SnapshotVect();
  const int status = parameterized.field->minimize(
      snapshotFrequency, snapshots, maxIterations, 1e-4, 1e-6);
  RDKit::Trajectory trajectory(3, mol.getNumAtoms(), snapshots);
  for (unsigned int index = 0; index < trajectory.size(); ++index) {
    const auto &snapshot = trajectory.getSnapshot(index);
    auto snapshotCoordinates = snapshotPositions(snapshot, mol.getNumAtoms());
    if (std::isfinite(snapshot.getEnergy()) &&
        finitePositions(snapshotCoordinates)) {
      addFrame(frames, snapshot.getEnergy(), snapshotCoordinates);
      positions = std::move(snapshotCoordinates);
    }
  }

  // ForceField::minimize writes the final positions back to the conformer.
  auto finalPositions = conformerPositions(mol);
  const double finalEnergy =
      parameterized.field->calcEnergy(finalPositions.data());
  if (!std::isfinite(finalEnergy) || !finitePositions(finalPositions)) {
    throw std::runtime_error("The minimized force-field energy is not finite");
  }
  if (finalPositions != positions) {
    addFrame(frames, finalEnergy, finalPositions);
  }

  bj::object result;
  result["forcefield"] = parameterized.name;
  result["fallback"] = parameterized.fallback;
  result["initialEnergy"] = initialEnergy;
  result["finalEnergy"] = finalEnergy;
  result["converged"] = status == 0;
  result["frames"] = std::move(frames);
  return bj::serialize(result);
}

}  // namespace

std::string JSMolBase::run_forcefield(const std::string &details) {
  try {
    const auto options = parseDetails(details);
    const auto job = getJob(options);
    auto &mol = get();
    return job == "energy" ? forceFieldEnergy(mol) : minimize(mol, options);
  } catch (const std::exception &error) {
    return logFailure("run_forcefield", error.what());
  } catch (...) {
    return logFailure("run_forcefield", "unknown error");
  }
}

std::string JSMolBase::generate_conformers(const std::string &details) {
  try {
    const auto options = parseDetails(details);
    const auto count = getCount(options, "count", 10);
    const auto randomSeed = getSeed(options, "randomSeed", -1);
    const auto pruneRmsThreshold =
        getNumber(options, "pruneRmsThreshold", -1.0);
    const auto minimizeIterations = getCount(options, "minimizeIterations", 0);

    auto &mol = get();
    auto parameters = RDKit::DGeomHelpers::ETKDGv3;
    parameters.randomSeed = randomSeed;
    parameters.numThreads = 1;
    parameters.clearConfs = true;
    parameters.pruneRmsThresh = pruneRmsThreshold;
    parameters.onlyHeavyAtomsForRMS = true;
    parameters.useSymmetryForPruning = true;
    parameters.symmetrizeConjugatedTerminalGroupsForPruning = true;
    auto conformerIds =
        RDKit::DGeomHelpers::EmbedMultipleConfs(mol, count, parameters);
    if (count && conformerIds.empty()) {
      parameters.useRandomCoords = true;
      conformerIds =
          RDKit::DGeomHelpers::EmbedMultipleConfs(mol, count, parameters);
      if (conformerIds.empty()) {
        throw std::runtime_error("ETKDGv3 could not embed this molecule");
      }
    }

    bj::array conformers;
    std::string forcefield;
    unsigned int minimizedCount = 0;
    for (int conformerId : conformerIds) {
      if (minimizeIterations) {
        try {
          auto parameterized = parameterize(mol, conformerId);
          parameterized.field->minimize(minimizeIterations, 1e-4, 1e-6);
          forcefield = parameterized.name;
          minimizedCount++;
        } catch (const std::exception &) {
          // ETKDG coordinates remain valid when no force field covers the
          // molecule.
        }
      }
      const auto positions = conformerPositions(mol, conformerId);
      if (!finitePositions(positions)) {
        throw std::runtime_error("ETKDGv3 returned non-finite coordinates");
      }
      conformers.push_back(positionsArray(positions));
    }

    bj::object result;
    result["minimizedCount"] = minimizedCount;
    if (forcefield.empty()) {
      result["forcefield"] = nullptr;
    } else {
      result["forcefield"] = forcefield;
    }
    result["conformers"] = std::move(conformers);
    return bj::serialize(result);
  } catch (const std::exception &error) {
    return logFailure("generate_conformers", error.what());
  } catch (...) {
    return logFailure("generate_conformers", "unknown error");
  }
}
