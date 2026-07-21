---
slug: earthquake-frame-visualization
title: Visualizing Frame Drift Around a Detached Wall
authors: [omry]
tags: [engineering, projects, visualization]
description: An interactive look at how earthquake-driven storey drift can close the clearance around a detached reinforced-concrete or ICF wall.
draft: false
---

import VideoPlayer from '@site/src/components/VideoPlayer';

During an earthquake, a building frame sways and its floors move relative to
one another. A wall inside the frame may be intentionally detached, with enough
clearance for the frame to move without pushing on it.

That separation matters even more when the wall is reinforced concrete, such
as an [insulated concrete form (ICF) wall](https://bsesc.energy.gov/energy-basics/insulated-concrete-forms),
rather than a lightweight partition. If the frame closes the clearance and
contacts the wall, the two begin interacting and both can be damaged.

The design challenge is to size this **seismic gap** and connect the wall to the
columns in a way that keeps the wall stable while still allowing the frame to
move independently. The wall needs support without unintentionally becoming
part of the building's earthquake-resisting system.

I built this interactive visualization to make the gap-closing problem easier
to see and to show how the beams and columns move relative to the detached
wall.

<!-- truncate -->

Watch the video below and then [try it in your
browser](pathname:///lab/earthquake-frame/).

<VideoPlayer
  title="Detached reinforced-concrete walls under lateral earthquake motion"
  manifest="/omegaflow-videos/earthquake-demo/presentation/recording.presentation.json"
/>

The visualization is conceptual and does not predict real earthquake motion or
damage.
