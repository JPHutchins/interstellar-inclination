---
title: Comparing Firmware Development Environments
author: JP Hutchins
date: 2024-10-10
preview: |
    A comparison of developer experience and toolchain performance in Window 11,
    WSL2, Ubuntu 24.04, and VMWare Workstation 17.
---

```mermaid
---
config:
  xyChart:
    width: 900
    xAxis:
      labelFontSize: 12
  themeVariables:
    xyChart:
      plotColorPalette: "#b342a0"
---
xychart-beta
    title "Zephyr Build System Benchmark"
    x-axis "Platform" ["Ubuntu 24.04 6.8", "WSL2 24.04 5.15", "WSL2 24.04 6.1", "macOS Sonoma*", "Windows 11", "VMWare (no AMD-V)" ]
    y-axis "Build duration in seconds (lower is better)" 0 --> 1680
    bar [664.44, 754.642, 723.323, 741.547, 1393.901, 1655.560]
```

<br />

About a year and a half ago, I decided to take a different approach to setting up a Zephyr environment for a new project at [Intercreate](https://www.intercreate.io/). Instead of using my trusty VMWare Workstation Linux VM, I opted for WSL2. I was curious to find out: Would hardware pass-through for debugging work reliably? Would all of the tooling dependencies be supported? What about build system performance?

Not only did everything go smoothly, but since then, many colleagues have also moved from native Linux or traditional VMs to WSL2 and seen great results.

[Continue reading at the Interrupt...](https://interrupt.memfault.com/blog/comparing-fw-dev-envs)