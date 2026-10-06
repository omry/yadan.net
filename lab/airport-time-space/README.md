# Airport Time / Space

A standalone JavaScript lab that reconstructs free 3D point positions from
pairwise distances. The optimizer uses no airport geography, assumed sphere,
or rendered surface. The surface follows the current point cloud for display.

## Run and check

From this directory, with Node.js and Python 3 installed:

```sh
npm start
npm run check
npm test
npm run benchmark
npm run benchmark:plane
```

No npm installation is required for this app. `dist/` contains the complete
static website, including all flight observations, flags, examples, and reports.
The Python collection and validation scripts use the standard library.

The parent website copies `dist/` into `static/lab/airport-time-space/` before
`npm start` or `npm run build`, and GitHub Pages serves it at
`https://yadan.net/lab/airport-time-space/`. The generated copy is ignored by Git.
After changing app files during website development, restart the parent dev
server, or run `node scripts/prepare-lab.mjs` from the repository root.

## Experiments and fitting

All points start at seeded random XYZ positions (or an optional flat start).
Degree-normalized gradient descent with backtracking reduces weighted squared
distance error. Annealing perturbs groups and tries another random start to
escape local minima while preserving the best visible fit. A flat start can
leave its plane using a negative-curvature direction from the same loss.

The synthetic sphere and flat-plane datasets use exact Euclidean distances;
reference positions are withheld from the optimizer. Flight schedules are only
a noisy distance proxy: winds, routing, aircraft speeds, and airport overhead
can distort the inferred shape. Neither low error nor roundness proves that
real geography has been recovered. Rotation and reflection are arbitrary.

Defaults use recognized jets, at least four connections per airport, repeated
triangle-inconsistency filtering, and reduced weight for flights under three
hours. No uniform overhead is subtracted. Directional observations are averaged
separately, then both directional means receive equal weight when available.
Text labels show the top 10% hubs; all retained airports take part in fitting.
Selecting an airport in the list centers and reveals its marker and label.

## CSV import

Required columns: `from_airport,to_airport,minutes`.
Optional columns: `aircraft,aircraft_code`. Durations must be positive and at
most 2,880 minutes. Use 4–300 connected airports, at most 100,000 observations,
and a file no larger than 32 MB. Aircraft data enables jet filtering. Uploaded
records are assumed to be nonstop; they are not independently verified.
Geographic and other extra columns are ignored. CSV processing stays in the
browser. The app's **CSV format** help includes a downloadable complete example.

## Data and provenance

Built-in data contains dated, aircraft-specific published nonstop schedules,
not actual flown times. `flights.json` lists the observation shards and each
record retains its original schedule source and nonstop-verification evidence.
`aircraft-flights.csv` exports the observations. Audits and earlier investigation
reports are available under About → Data & downloads; reports describe their
own historical filter settings and are not necessarily the current default fit.

Collectors, validation scripts, benchmarks, and existing regression tests are
retained in `scripts/`. Independent reference geography used in earlier
investigations is not bundled or supplied to the production optimizer.
FlagCDN flags are bundled as data URIs. The flight-route evidence license is
preserved in `scripts/flight-route-evidence-LICENSE.txt`. Google Fonts is the
only optional runtime network dependency; system fonts provide a fallback.

This import preserves the deployed app from source commit
`bf727d703e58716a4ae572213d7139fb195101e9`; Sites project metadata and credentials
are not part of the repository.
