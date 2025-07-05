---
title: GitHub Actions for the Python Package Index
author: JP Hutchins
date: 2024-06-08
preview: |
    The introductory post of a series about designing, building, and sharing
    universally compatible software written in Python.
---

In the first part of this series, we set up a repository for a universally portable Python app. Today, we will register the package with [PyPI, the Python Package Index](https://pypi.org/), and use a GitHub Release Action to automate the distribution so that other Python users can install the app with `pipx` or `pip`.

[GitHub Actions](https://github.com/features/actions) are automated routines that run on GitHub's sandboxed virtual machine servers, called "runners", and are ([probably](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)) free for your Public open source projects!

## Table of Contents

## Security

Let's first walk through the security threats that we will mitigate when deploying an app to PyPI. Here is a list of threats that could put your users, and you, at risk:

1. An attacker poses as a contributor and merges malicious code to your package via a **Pull Request**.
    
2. An attacker hacks PyPI so that when a user tries to install your app they install a malicious package instead.
    
3. An attacker logs in to your **GitHub account** and replaces your app's repository with malicious code or uses a leaked **Personal Access Token (PAT)** or **Secure Shell (SSH) key** to push directly to the repository.
    
4. An attacker logs in to your **PyPI account** and replaces your package with malicious code.
    
5. An attacker creates a malicious Python package with the **same name** as yours and distributes it outside of PyPI.
    
6. An attacker uploads a malicious Python package to PyPI with a name that is similar to yours ("typo squatting"), the intention being to **trick users into downloading the wrong package**.
    
7. An attacker has compromised one of your upstream dependencies, a "supply chain attack", so that your users are affected when importing or running your package.
    

Once we've learned how to mitigate each of these risks, we will show how applying them would have prevented a recent supply chain attack in which impacted 170,000 Python users.

### 1\. Reviewing Pull Requests

> [!WARNING]
> An attacker poses as a contributor and merges malicious code to your package via a **Pull Request**.

By default, GitHub will not allow any modification of your repository without your explicit approval. This threat can be minimized by carefully reviewing all contributions to your repository and only elevating a contributor's privileges once they are a trusted partner.[^1] If you believe that a PR is attempting to inject a security vulnerability in your app, then you should [report the offending account](https://docs.github.com/en/communities/maintaining-your-safety-on-github/reporting-abuse-or-spam#reporting-an-issue-or-pull-request).

[^1]: However, even if a contributor has made valuable contributions over years, you may eventually learn that you were the subject of a sophisticated social engineering campaign perpetrated by some larger government or private entity. ["XZ Utils backdoor"](https://en.wikipedia.org/wiki/XZ_Utils_backdoor). Wikipedia.com. Retrieved 2024-04-14.

### 2\. Vulnerability in the Package Repository (PyPI)

> [!WARNING]
> An attacker hacks PyPI so that when a user tries to install your app, they install a malicious package instead.

According to Stack Overflow's 2023 Developer Survey, **45.32% of professional developers use Python**.[^2] Every industry and government in the world would be impacted by this threat and therefore has a financial incentive to keep PyPI secure.

[^2]: ["Stack Overflow Developer Survey 2023 - Programming, scripting, and markup languages"](https://survey.stackoverflow.co/2023/#section-most-popular-technologies-programming-scripting-and-markup-languages). stackoverflow.co. Retrieved 2024-04-14.

PyPI completed a security audit in late 2023 that found and remediated some non-critical security risks.[^3]

[^3]: ["PyPI Completes First Security Audit"](https://blog.pypi.org/posts/2023-11-14-1-pypi-completes-first-security-audit/). PyPI.org. Retrieved 2024-04-14.

### Authentication

Threats #3-#6 all fall under the category of authentication: proving that your app, once received by your user, is an unmodified copy of your work - that it is *authentic*. Keep in mind that your user's trust is strengthened by your lack of anonymity. If the application can be authenticated, then it can be permanently tied to your GitHub account, your PyPI account, then your email addresses, and ultimately, to *you*. Legal action can be taken against *you*, which is a good reason not to distribute malware on PyPI.

So, how can we prove that the software that a user receives when they type `pipx install jpsapp` is authentic? Let's look at each threat individually.

### 3\. Protecting Your GitHub Account

> [!WARNING]
> An attacker logs in to your **GitHub account** and replaces your app's repository with malicious code or uses a leaked **Personal Access Token (PAT)** or **Secure Shell (SSH) key** to push directly to the repository.

Protection of your GitHub account web login is the same as it would be for any other sensitive website: use a strong password that is unique to the website (use a [password manager](https://bitwarden.com/resources/why-enterprises-need-a-password-manager/)) and use two-factor authentication (2FA).

There is a more direct path for an attacker to take, however, which is to obtain one of your SSH keys or Personal Access Tokens.

#### SSH Keys

The starting point is that your SSH keys should never leave your device - not in an email, a text message, over a network share, and **especially not as a commit to a remote repository**.

Therefore, the threat is limited to the attacker gaining physical access to your PC. Again, common mitigations come into play: enable your computer's lock screen after a short inactivity timeout, use a strong password, and enable full disk encryption. The disk encryption is important in the event that your computer is stolen because it will prevent an attacker from accessing the contents of your disk by physically removing your storage drive and mounting it on their own machine. In the event that an attacker does have physical access to your PC, you can still prevent the attacker from gaining access to your repositories by [going to GitHub and revoking any SSH keys](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/reviewing-your-ssh-keys) from the compromised computer.

#### Personal Access Tokens

Personal Access Tokens (PATs) are an excellent way of providing temporary authentication to a repository from a computer that does not have access to your SSH key. This is much better than simply sharing the SSH key since it prevents your SSH key from leaking. PATs can be created with a specific security scope and include an expiration date. However, even with all of these features in mind, creating many PATs and forgetting to delete them effectively leaks authentication all over the place - so delete them right after you no longer need them!

In summary, keep your SSH keys and PATs secret and regularly audit your GitHub account to revoke access from any SSH keys or PATs that are no longer needed.

### 4\. Protecting your PyPI Account

> [!WARNING]
> An attacker logs in to your **PyPI account** and replaces your package with malicious code.

Protection of your PyPI account web login is the same as it would be for any other sensitive website: use a strong password that is unique to the website (use a [password manager](https://bitwarden.com/resources/why-enterprises-need-a-password-manager/)) and use two-factor authentication (2FA).

### 5\. Package Impersonation

> [!WARNING]
> An attacker creates a malicious Python package with the **same name** as yours and distributes it outside of PyPI.

By default, tools like `pip` and `pipx` will search PyPI for the package specified. To install a package from an outside source, `pip` would need to be told explicitly to point to the location of the infected package.

From the command line:

```plaintext
pip install https://m.piqy.org/packages/ac/1d/jpsapp-1.0.0.tar.gz
```

Or in `pyproject.toml`:

```toml
[dependencies]
jpsapp = { url = "https://m.piqy.org/packages/ac/1d/jpsapp-1.0.0.tar.gz" }
```

You can mitigate this threat by providing clear and explicit instructions about obtaining your package. I recommend adapting this example and placing it prominently in your `README.md` and other documentation.

````markdown
## Install

`jpsapp` is [distributed by PyPI](https://pypi.org/project/jpsapp/)
and can be installed with [pipx](https://github.com/pypa/pipx):
```
pipx install jpsapp
```
````

### 6\. Typo Squatting

> [!WARNING]
> An attacker uploads a malicious Python package to PyPI with a name that is similar to yours ("typo squatting"), the intention being to **trick users into downloading the wrong package**.

For example, a user intending to install `matplotlib` may make the typo `matplotli` and accidentally install the wrong package. In a sophisticated supply chain attack, the `matlplotli` package would be mostly identical to the latest `matplotlib` package with the only differences being obfuscated malware installation and execution.

#### Protect Yourself

By making a typo when adding a dependency to your package, you could compromise not only your own PC, but the PC's of all your users. Whenever possible, copy and paste the dependency name from the official documentation. When in doubt, verify the package name directly at PyPI.org.

#### Protect Your Users

It's impossible to completely mitigate one of your users making a typo, but you can make it easy for them to avoid the possibility altogether by providing clear and explicit instructions for installing your package as an application or as a dependency.

When using code blocks in markdown documentation, it is preferred to put your code in blocks using three backticks rather than one. This format makes it easier to select for copy and paste and GitHub will provide a clickable "copy" shortcut on the right side of the code block, as seen below.

![Screenshot of GitHub Adding a "copy" link to code blocks](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ag40abvp5kc1xv65nrag.png)

Make certain that the command you've added to the documentation is runnable as written. For example, adding prefixes like `$>` or `>>>` would make your command example unusable without modification and subsequently reintroduce the typo squatting threat.

### 7\. Supply Chain Attack

> [!WARNING]
> An attacker has compromised one of your upstream dependencies, a "supply chain attack", so that your users are affected when importing or running your package.

You've done everything right. But, one day when you're updating your project's dependencies, you unknowingly infect your package and all of your users because one of *your dependencies* fell victim to one of the threats described above.

It is your responsibility as the package maintainer to select broadly-used and well-maintained dependencies for your application. Be wary of packages that do not have recent commits (🌈*maybe they have no bugs*🌈) or low user counts. Always research a variety of options that meet your requirements and double check that Python does not have a [builtin](https://docs.python.org/3/) that works for you!

## Case Study: topggpy Supply Chain Attack

On March 25th, 2024, Checkmarx broke the news of a successful supply chain attack that affected more than 170,000 Python users.

Once infected, the attackers would have remote access to the user's Browser Data, Discord Data, Cryptocurrency Wallets, Telegram Sessions, User Data and Documents Folders, and Instagram Data.[^4] I suggest reading the entire [article](https://checkmarx.com/blog/over-170k-users-affected-by-attack-using-fake-python-infrastructure/) before returning here to see how every aspect of the attack would have been mitigated by the strategies discussed above.

[^4]: ["Over 170K Users Affected by Attack Using Fake Python Infrastructure"](https://checkmarx.com/blog/over-170k-users-affected-by-attack-using-fake-python-infrastructure/). Checkmarx.com. Retrieved 2024-04-14.

### Protecting Your GitHub Account

The primary failure for topggpy was editor-syntax's GitHub account being compromised. [Above](#3-protecting-your-github-account), we discussed industry standard approaches utilizing password managers and two-factor authentication.

### Reviewing Pull Requests

editor-syntax was not the account owner of the topggpy [repository](https://github.com/Top-gg-Community/python-sdk) yet had write access to the repository. Granting a Collaborator write permissions while lacking the requirement for a Pull Request and Approval is a non-default GitHub Security configuration. Remember that contributors do not need to have any special privileges to your repository in order to make Pull Requests from their own Fork. When you are ready to add a Collaborator to your project, consider [restricting their permissions](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-user-account-settings/permission-levels-for-a-personal-account-repository) to the bare minimum required for their role.

### Authentication

Delivery of the malware was accomplished by delivering users an inauthentic but fully functional version of the colorama package that would fetch, install, and execute the malware in the background simply by using the topggpy package as normal.

If the changes that editor-syntax's compromised account made had been required to go through Pull Request and Approval, the attack would have been stopped. The offending commit is [here](https://github.com/Top-gg-Community/python-sdk/commit/ecb87731286d72c8b8172db9671f74bd42c6c534):

```diff
- aiohttp>=3.6.0,<3.9.0
+ https://files.pythonhosted.org/packages/18/93/1f005bbe044471a0444a82cdd7356f5120b9cf94fe2c50c0cdbf28f1258b/aiohttp-3.9.3.tar.gz
+ https://files.pythonhosted.org/packages/7f/45/8ae61209bb9015f516102fa559a2914178da1d5868428bd86a1b4421141d/base58-2.1.1.tar.gz
+ https://files.pypihosted.org/packages/ow/55/4862e96575e3fda1dffd6cc46f648e787dd06d97/colorama-0.4.3.tar.gz
+ https://files.pythonhosted.org/packages/e0/b7/a4a032e94bcfdff481f2e6fecd472794d9da09f474a2185ed33b2c7cad64/construct-2.10.68.tar.gz
+ https://files.pythonhosted.org/packages/7e/86/2bd8fa8b63c91008c4f26fb2c7b4d661abf5a151db474e298e1c572caa57/DateTime-5.4.tar.gz
```

In this case it loads the tainted `colorama` package from a non-PyPI, typo-squatted domain, `files.pypihosted.org`, that was registered by the attackers to impersonate authentic packages.

Note that `files.pythonhosted.org` and `pypi.org` are both authentic PyPI domains. As discussed in [Package Impersonation](#5-package-impersonation), package dependencies generally should not point to URLs and instead let the package manager resolve the resource. Violation of this approach would have been immediately obvious during review of the Pull Request and the attack would have been thwarted.

## Automated PyPI Publishing Tutorial

Now that we've discussed some of the security risks involved in distributing a Python package, let's create a secure workflow that automates many of the tasks that would otherwise introduce opportunities for user error.

### Create an Account at PyPI.org

Create an account at [PyPI.org](https://pypi.org/) and remember to use a strong password that is secured by a password manager and enable 2FA, as discussed [above](#4-Protecting-your-PyPI-Account).

### Add a Trusted Publisher at PyPI.org

Once you are logged in to your account, select "Your projects" from the account dropdown in the upper right-hand corner. Click on "Publishing" and scroll down to "Add a new pending publisher".

Under the "GitHub" tab, fill out the fields following the example below.

* **PyPI Project Name**: `jpsapp`. Your package name as defined by the `name` field of your `pyproject.toml` and the directory name of the package.
    
* **Owner**: `JPHutchins`. Your GitHub User or Organization name
    
* **Repository name**: `python-distribution-example`. The name of the repository as it is in the GitHub URL, e.g. `github.com/JPHutchins/python-distribution-example`
    
* **Workflow name**: `release.yaml`. The workflow will be located at `.github/workflows/release.yaml`.
    
* **Environment name**: `pypi`. We will configure this environment at github.com
    

Click "Add"

### Define the Release Action

A GitHub Release Action is a Workflow that is triggered by creating a release of your app. For example, if you've made some important changes over a few weeks that you'd like your users to benefit from, tagging and releasing the new version of your app is the best way to accomplish it.

Because this is free and open source software, there will be no fees for the cloud virtual machines provided by GitHub.

All code snippets belong to the file `release.yaml`, the complete version of which you can find here. The original example is from [this excellent article](https://packaging.python.org/en/latest/guides/publishing-package-distribution-releases-using-github-actions-ci-cd-workflows/)

```yaml
name: Release
```

This will be the name displayed in the GitHub Actions interface.

---

```yaml
env:
  name: jpsapp
```

This adds a variable to the workflow, accessible via `${{ env.name }}`. It is a simple convenience that allows the rest of this workflow definition to be reused in other repositories by simply changing the name on this line instead of throughout the file.

---

```yaml
on:
  release:
    types: [published]
```

Declares that the workflow should run whenever a new release is published.

---

```yaml
jobs:
```

Everything indented under the `jobs:` section are the definitions of the actions to perform.

---

```yaml
  build-dist:
    name: 📦 Build distribution 
    runs-on: ubuntu-latest
```

Declare a job named `build-dist` with friendly name "📦 Build distribution" that will run on an Ubuntu (Linux) runner.

---

```yaml
    steps:
```

Everything indented under the `steps:` section are the steps to perform for this `job`.

---

```yaml
    - uses: actions/checkout@v4
```

This is almost always the first step in a job that will make use of the repository source code. This may sound obvious, but it's best to be explicit about what resources are being made available, so it is required.

> [!TIP] If you are using the Git tag as the Single Source of Truth for your package version, then you'll probably need a step like `run: git fetch --prune --unshallow --tags` to make sure that you have the latest tags on the runner. See the more sophisticated build scripts and workflows of a real app, like [smpmgr](https://github.com/intercreate/smpmgr), for details.

---

```yaml
    - uses: actions/setup-python@v5
      with:
        python-version: "3.x"
        cache: "pip"
```

Setup Python using the default version and create a cache of the pip install. The cache will allow workflows to run faster by reusing the global python environment installed by `pip` in the next step, assuming that the dependencies have not changed since the cache was created.

---

```yaml
    - run: pip install .[dev]
```

Install the development dependencies. The workflow runs on a fresh Python environment, so we can simplify things somewhat by not using the venv.

---

```yaml
    - run: python -m build
```

Build the **sdist** and **wheel** of your app. The files generated by this kind of build system are called "artifacts", and these are the files that will be sent to PyPI.

---

```yaml
    - name: Store the distribution packages
      uses: actions/upload-artifact@v4
      with:
        name: python-package-distributions
        path: dist/
```

Upload the sdist and wheel, which are located at `dist/`, as artifacts so that they are available for download in the GitHub Actions interface and easily accessible from the next `job` using `actions/download-artifact`.

---

```yaml
  publish-to-pypi:
    name: Publish Python 🐍 distribution 📦 to PyPI
    runs-on: ubuntu-latest
    needs: build-dist
    environment:
      name: pypi
      url: https://pypi.org/p/${{ env.name }}
    permissions:
      id-token: write  # IMPORTANT: mandatory for trusted publishing
```

Declare another job for the Ubuntu runner, `publish-to-pypi`, with the friendly name "Publish Python 🐍 distribution 📦 to PyPI", that runs after the job `build-dist` has completed successfully.

This job also uses the environment, `pypi`, that we created earlier, and defines the `url` variable in the environment. The url, `https://pypi.org/p/${{ env.name }}`, will resolve to `https://pypi.org/p/jpsapp`, and will be used by the `pypa/gh-action-pypi-publish` step later in this job. You can read more about environments on the [GitHub Docs](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment).

Finally, the job requires the `id-token: write` permission to [allow the OpenID Connect (OIDC) JSON Web Token (JWT)](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#adding-permissions-settings) to be requested from GitHub by the `pypa/gh-action-pypi-publish` action. This OIDC token provides proof to PyPI that the package distribution upload is authentic; that is, it ties the release directly to the GitHub workflow run and thereby to your GitHub account. This kind of temporary token authentication prevents using your GitHub or PyPI account credentials directly, which could create an opportunity for them to leak.

---

```yaml
    steps:
      - name: Download all the dists
        uses: actions/download-artifact@v4
        with:
          name: python-package-distributions
          path: dist/
      - name: Publish distribution 📦 to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
```

The first step downloads the dists that were built and uploaded by the `build-dist` job and the second step uploads those dists to the Python Package Index.

---

```yaml
  publish-dist-to-github:
    name: >-
      Sign the Python 🐍 distribution 📦 with Sigstore
      and upload them to GitHub Release
    needs:
    - publish-to-pypi
    runs-on: ubuntu-latest

    permissions:
      contents: write  # IMPORTANT: mandatory for making GitHub Releases
      id-token: write  # IMPORTANT: mandatory for sigstore

    steps:
    - name: Download all the dists
      uses: actions/download-artifact@v4
      with:
        name: python-package-distributions
        path: dist/
    - name: Sign the dists with Sigstore
      uses: sigstore/gh-action-sigstore-python@v2.1.1
      with:
        inputs: >-
          ./dist/*.tar.gz
          ./dist/*.whl
    - name: Upload artifact signatures to GitHub Release
      env:
        GITHUB_TOKEN: ${{ github.token }}
      # Upload to GitHub Release using the `gh` CLI.
      # `dist/` contains the built packages, and the
      # sigstore-produced signatures and certificates.
      run: >-
        gh release upload
        '${{ github.ref_name }}' dist/**
        --repo '${{ github.repository }}'
```

This job signs the dists and uploads the dists, signatures, and certificates to the GitHub Release. While it's best for your users to install your app via `pipx`, this does allow users to verify the authenticity of the dists that are hosted on the GitHub Release page using [instructions](https://www.python.org/download/sigstore/) provided by Python.

---

Take a look the complete [release.yaml](https://github.com/JPHutchins/python-distribution-example/blob/e31907bec7a31e8ef7edc1dd33dfb10b6c0f496b/.github/workflows/release.yaml#L1-L87) and use it as a template for your own applications or libraries.

### Create the Release

All of the hard work of automating the PyPI release process is out of the way and now it's time to deploy!

> [!NOTE]
> **About Versioning**
>
> <br />
>
> When your application or library is ready for a release, the first step is tagging the version in some way. PyPI is only going to care about the version line in your `pyproject.toml`, while GitHub will want a Git tag for the release. There may be many differences of opinion on *how* to make sure that these match, but most will agree that these _should_ match.
> 
> <br />
>
> The simplest approach is to make a commit that bumps the version in `pyproject.toml` with a commit message like "version: 1.0.1". Immediately follow that up with a git tag that matches: `git tag 1.0.1` and `git push --tags` (use an annotated tag if you prefer), or create the tag from GitHub, as will be demonstrated below. The downside here is that the lack of a Single Source Of Truth (SSOT) creates room for error when tagging release versions.
>
> <br/>
>
>For that reason, many approaches for establishing a SSOT have been developed, and you may find one that you prefer. Some examples are the [poetry-version-plugin](https://github.com/tiangolo/poetry-version-plugin) and [setuptools-git-versioning](https://setuptools-git-versioning.readthedocs.io/en/v2.0.0/). [GitPython](https://github.com/gitpython-developers/GitPython) can be used to enforce strict release rules. The plugin will fill in the Python package version according to the git tag, and [GitPython](https://github.com/gitpython-developers/GitPython) can be used to enforce that the version matches, that the repository is not dirty and has no changes on top of the tag, or anything else that *you don't want to mess up*. For a real world example, take a look at [smpmgr's build scripts](https://github.com/intercreate/smpmgr/blob/41683521f850e39f2ce838250483699b16507f76/portable.py#L17-L28).

#### GitHub Release Walkthrough

At your GitHub repository's main page, click "Releases"

![GitHub Releases Link Screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wzkdv5bos8pruiypz79t.png)

Click "Draft a new release"

![Draft a new release screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hvh1m29by388yxp4lkr2.png)

Drop down "Choose a tag" and select a tag that you've already created or create a new one. It should match the version in your `pyproject.toml`!

![choose a tag screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/fryj47kbb9csb4k9kqr4.png)

Use the version as the Release Title

![release title screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5l2v8x6z97r6m18r4kc4.png)

Click on "Generate release notes" and then edit the release markdown with any other release information that is important to your users.

![release notes screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cs0rc8l9w5h7nbj6n33l.png)

When you are done, click "Publish release" to create the Release page and start the Release Workflow.

![Publish release screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rtjerf1k7w9iprdleu7v.png)

You can view your new release page, but it won't have any assets other than a snapshot of your repository at this tag, which is default GitHub release behavior.

![release before actions complete screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/csqv0jxbq1ztvgpgp42x.png)

To check on the progress of your Release Workflow, click on "Actions".

![actions link screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uxbq31x30ksszsb6bh3i.png)

Now, in the "All workflows" view, you'll see a list of actions that have succeeded (green), failed (red), or are currently running (yellow). This screenshot shows that our recent release action is still running.

![all workflows screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/y7rsfuym758a4nqcinam.png)

Clicking on the running workflow brings up the "Summary" where you can check in on the progress of workflows and view logs. This is particularly useful when a workflow fails!

![actions summary screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qmduq61aivnvn36phjfc.png)

Once the workflow has completed successfully, all artifacts will have been uploaded to the release page that only had two assets before.

![release after workflow screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9z41cg2s3eq0e92r63b3.png)

Success of the workflow also means that your package has been published to PyPI.

![pypi screenshot](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wbb3ny4whficty694mo9.png)

## Test the Release

After the GitHub Release Workflow has completed, you will find the latest version of your package at `pypi.org/p/<YOUR APP>`, e.g. [pypi.org/p/jpsapp](https://pypi.org/p/jpsapp/).

You can install it with `pip`, but because we are focused on applications, not libraries, there is a much better tool: [pipx](https://pipx.pypa.io/stable/). `pipx` provides a much needed improvement to `pip` when installing Python applications and libraries for use, rather than development.

[pipx installation instructions](https://github.com/pypa/pipx?tab=readme-ov-file#install-pipx)

To test your application with `pipx`, do:

```plaintext
pipx install <YOUR APP>
```

For example, try:

```plaintext
pipx install jpsapp
```

`<YOUR APP>` will be in your system PATH and can be run from any terminal. It can be upgraded to the latest version with:

```plaintext
pipx upgrade <YOUR APP>
```

## Conclusion

With a release workflow that is securely automated by a GitHub Action, you can quickly iterate on your application or library and provide clear instructions to your users about how to receive an authentic copy of your software.

In the next part of this series, we will use the same Release Workflow to create the universally portable versions of the application so that your users do not need a Python environment to use your application.
