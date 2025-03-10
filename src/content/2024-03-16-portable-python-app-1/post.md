---
title: Building a Universally Portable Python App
author: JP Hutchins
date: 2024-03-16
preview: |
    The introductory post of a series about designing, building, and sharing
    universally compatible software written in Python.
---

Welcome to the first article of a series about deploying a universally portable Python application.

## What is a "Universally Portable" app?

A **portable**, or **standalone**, application is one that has no install-time
or run-time dependencies other than the operating system.[^1] It
is common to see this kind of application distributed as a compressed archive,
such as a .zip or .tar.gz, or as an image, like .bin or .dmg. A **universal** application is one that can run on all operating systems and architectures. Here, we use "universal" loosely to mean the three personal computer operating systems that make up over 90% of global market share: **Windows** (72.13%), **MacOS** (15.46%), and **Linux** (4.03%).[^2]

[^1]: ["Portable application"](https://en.wikipedia.org/wiki/Portable_application). Wikipedia.com. Retrieved 2024-03-11.
[^2]: ["OS Market Share"](https://gs.statcounter.com/os-market-share/desktop/worldwide). GS.Statcounter.com. Retrieved 2024-03-11

Windows and Linux builds will target the **amd64** (x86-64) architecture and MacOS will target Arm64 (**"Apple Silicon"** M-series Macs). Arm, aarch64 or arm32, builds for Linux would be possible locally but are not available in a GitHub Workflow, [yet](https://github.blog/changelog/2023-10-30-accelerate-your-ci-cd-with-arm-based-hosted-runners-in-github-actions/).

You can test the output of this tutorial by installing the example application, `jpsapp`, yourself.

### Use portable ZIPs or OS installers

[GitHub: jpsapp releases page](https://github.com/JPHutchins/python-distribution-example/releases)

### Install with pipx

```plaintext
pipx install jpsapp
jpsapp --help
```

## The Series

1. **This article: build the app locally with** [**build**](https://build.pypa.io/en/stable/)
    
2. Use a GitHub Release Action to automate distribution to [PyPI, the Python Package Index](https://pypi.org/) so that Python users can install your app with [pip](https://pip.pypa.io/en/stable/) and [pipx](https://github.com/pypa/pipx).
    
3. Add the universal portable application build to the GitHub Release Action using [PyInstaller](https://github.com/pyinstaller/pyinstaller)
    
4. Add a **Windows MSI** installer build to the GitHub Release Action using [WiX v4](https://wixtoolset.org/docs/intro/)
    
5. Add **Linux .deb and .rpm** installer builds to the GitHub Release Action using [fpm](https://github.com/jordansissel/fpm)
    
6. Deploy to the **Microsoft Store** and `winget`
    
7. Deploy to the **Mac App Store**
    
8. Deploy to the **Debian Archive**
    

## The App

This article will focus on the application itself and the tooling to support it.

The app is a command line interface (CLI) that uses the built in [`argparse`](https://docs.python.org/3/library/argparse.html) module and takes one of three actions:

1. no argument: print "Hello, World!"
    
2. `-i` or `--input`: print "Hello, World!", then "Press any key to exit...". This is used to create a double-clickable version of the application for Windows users
    
3. `-v` or `--version` argument: print package version and exit
    

Take a look at the [source code](https://github.com/JPHutchins/python-distribution-example/blob/main/jpsapp/main.py).

## The Repo

The repository, [python-distribution-example](https://github.com/JPHutchins/python-distribution-example/), can be cloned to your Windows, Linux, or MacOS environment.

The following are excerpts and explanations of the files that are relevant to running the app locally.

> [!NOTE]
> Tooling and dependencies are intentionally kept to a minimum in this example repository. A more complicated app that has more dependencies will benefit from the usage of tools that help to resolve dependencies and manage environments. Unfortunately, there is no easy recommendation to make.
>
> <br>
> 
> I suggest reading Anna-Lena Popkes' article, [An unbiased evaluation of environment management and packaging tools](https://alpopkes.com/posts/python/packaging_tools/), to help you to form an opinion about what tooling is best for your application.
>
> <br>
>
> This repository demonstrates a highly compatible `pyproject.toml` that readers can easily adapt to their choice of tooling.

### `jpsapp/`

This is the Python module itself and contains all of the source code for the application.

* `__main__.py`: support running as a module - `python -m jpsapp`
    
* `main.py`: the [app described above](#the-app)
    

### `envr-default`

This file defines the shell environment for common shells like **bash**, **zsh**, and **PowerShell** on Windows, MacOS, and Linux. The environment is activated by calling `. ./envr.ps1`

```ini
[PROJECT_OPTIONS]
PROJECT_NAME=jpsapp
PYTHON_VENV=.venv
```

### `pyproject.toml`

[PEP 621](https://peps.python.org/pep-0621/) introduced the `pyproject.toml` standard for declaring common metadata, replacing the need for `requirements.txt` and most other configuration files.

```toml
[build-system]
requires = [
    "setuptools>=70.0",
]
build-backend = "setuptools.build_meta"

[project]
name = "jpsapp"
version = "1.1.6"
description = "An example of Python application distribution."
authors = [
    { name = "JP Hutchins", email = "jphutchins@gmail.com" },
]
readme = "README.md"
license = { file = "LICENSE" }
requires-python = ">=3.8"
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "Topic :: Software Development :: Build Tools",
]

dependencies = [
    # Add your project dependencies here
]

[project.optional-dependencies]
dev = [
    "build>=1.2.1,<2",
    "pyinstaller>=6.4.0,<7",
    "pyinstaller-versionfile>=2.1.1,<3",
]

[project.scripts]
jpsapp = "jpsapp.main:app"

[project.urls]
Homepage = "https://dev.to/jphutchins/building-a-universally-portable-python-app-2gng"
Repository = "https://github.com/JPhutchins/python-distribution-example.git"

[tool.setuptools]
packages = ["jpsapp"]
include-package-data = true
```

For a detailed explanation of the `pyproject.toml`, refer to the [Python Packaging User Guide](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/). Here are a few interesting features of our example configuration.

`version = "1.1.6"` will version the python package and the eventual app. This line in the configuration is the Single Source Of Truth for the version. There are many tools available to establish a Git tag as the SSOT, if you prefer.

`packages = ["jpsapp"]` declares that `jpsapp` is the only module we are packaging. This allows more Python modules to be added to the root of the repository, such as the tooling in the `distrubution` folder, that we wouldn't want to package for distribution.

`jpsapp = "jpsapp.main:app"` declares that the command `jpsapp` will execute the `app` function from `jpsapp.main`.

## Dependencies

### Python

If you have Python &gt;=3.8 go ahead and use that. If not, install the most recent Python release for your system. There are many ways to do so, but I'll briefly offer my *opinion*:

* Windows: use the Microsoft Store or `winget` and take advantage of "App Execution Aliases". Whatever you do, make sure that both `python` and `python3` call the Python you want, none of this `py` nonsense!
    
* Linux: use your package manager, and maybe [deadsnakes](https://launchpad.net/~deadsnakes/+archive/ubuntu/ppa) if you're on Ubuntu since they don't keep their Python packages current.
    

> "A quote with a semantic \<cite\>"
> 
> <cite>Jean Ralphio, On Grapes</cite>

> [!NOTE]
> Hello
>
> <br>
>
> world!
>

> [!TIP]
> A tip

> [!IMPORTANT]
> Important
>

> [!WARNING]
> Warning

> [!CAUTION]
> Caution

## Build the App

Now that you have [cloned the repository](https://github.com/JPHutchins/python-distribution-example) and installed the [dependencies](#dependencies), you can build and run the application.

* `python3 -m venv .venv`: on this first run it will create the venv at `.venv`
    
    * If `python3` is not an alias to the version of Python 3 you'd like to use then update the command accordingly, e.g. `python -m venv .venv`.
        
* `. ./envr.ps1`: activate the development environment
    
* `pip install --require-virtualenv -e .[dev]`: install the development dependencies
    

And that's it! `jpsapp` should print "Hello, World!". Keep in mind that you can get the same execution with `python -m jpsapp`, `python -m jpsapp.main`, or `python jpsapp/main.py`, etc.

To build the Python package distributions, simply run `python -m build`. The Python `.whl` and `.tar.gz` packages will be built at `dist/`, e.g. `dist/jpsapp-1.0.0.tar.gz`.

In the [next part of this series](https://blog.jphutchins.com/github-action-for-the-python-package-index?source=more_series_bottom_blogs), we will use a GitHub Workflow to release the package distribution to the PyPI so that other users can install your app with `pipx`!

## Change History

* 2024-04-14: change `myapp` -&gt; `yourapp`
    
* 2024-04-18: change `yourapp` -&gt; `jpsapp`
    
* 2024-06-08: remove poetry; update pyproject.toml; update steps