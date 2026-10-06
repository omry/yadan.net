---
slug: airport-time-space
title: Reconstructing Airport Positions from Flight Times
authors: [omry]
tags: [engineering, projects, visualization]
description: An interactive experiment in recovering a 3D airport network from flight schedules, without supplying coordinates or an assumed shape.
draft: false
---

If you had flight times between airports but no map, what shape could you
recover?

I built [Time / Space](pathname:///lab/airport-time-space/) to explore that
question. It starts with airports scattered randomly in three dimensions, then
moves them to make the distances between connected airports match their flight
times. No latitude, longitude, or assumed sphere is supplied to the optimizer.

<!-- truncate -->

[![Time / Space showing a globe-like reconstruction of 201 airports from 3,875 flight-time constraints.](/img/lab/airport-time-space.png)](pathname:///lab/airport-time-space/)

*The airport network after fitting. Click the screenshot to explore it.*

A flight time becomes a target length: a pair with a longer flight should sit
farther apart than a pair with a shorter one. Each connection constrains two
points. Taken together, the connections constrain a whole network.

The optimizer repeatedly adjusts the positions to reduce the mismatch between
those target lengths and the current straight-line distances. After the local
fit settles, it tries perturbations and another random start to search for a
better arrangement. You can watch that process, pause it, and rotate the result.
The surface drawn between the airports follows their positions; it does not
push them into a particular shape.

The airport network settles into a roughly globe-like shape, with recognizable
regional groupings and some dents. Its orientation is arbitrary: the flight
times alone do not tell it which way is north. A reflected arrangement can fit
the same distances, too.

To separate the reconstruction method from the messiness of flight data, the
lab also includes two synthetic experiments. One uses exact distances between
points on a sphere; the other uses points on a flat plane. Both use the same
optimizer, with the original coordinates withheld. The sphere dataset recovers
a sphere, and the plane dataset recovers a plane. The shape comes from the
distances supplied to it.

Real flight data is less tidy. The built-in observations are published nonstop
schedules, rather than measured times from actual flights. Winds, routing,
aircraft speeds, and airport overhead all affect the relationship between time
and distance. There is also a geometric mismatch: flights travel over the
Earth's surface, while the optimizer fits straight-line distances in 3D.

The default filters keep jets, average the two travel directions when both are
available, require at least four connections per airport, exclude some
inconsistent constraints, and reduce the weight of short flights. These choices
make the proxy more useful, but they do not turn schedules into exact distances.
A low fitting error does not establish that every airport is in the right
place, or that the arrangement is unique.

Try switching between **Airport flight times**, **Synthetic · sphere**, and
**Synthetic · flat plane**. Use **New random start** to compare results, then
select an airport and open **Inspect airport** to see its individual constraints
and schedule sources. You can also import your own flight observations as a CSV;
the file is processed in your browser.

[Open Time / Space](pathname:///lab/airport-time-space/) and see how much shape
emerges from the connections alone.
