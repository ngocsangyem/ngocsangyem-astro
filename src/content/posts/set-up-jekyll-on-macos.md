---
title: "Set up a Jekyll environment on macOS"
date: 2022-03-14
tags: ["jekyll", "ruby", "macos"]
description: "Xcode tools, Homebrew, a Ruby that is not the system one, then Bundler and Jekyll, with the PATH edit each step actually needs."
---

Based on the Jekyll installation docs and on doing this more times than I would
like. The paths below assume Apple Silicon, where Homebrew installs into
`/opt/homebrew`. On an Intel Mac, read `/usr/local` everywhere `/opt/homebrew`
appears.

## Install the developer tools

Gems with native extensions need a compiler, so this comes first.

```bash
xcode-select --install
```

## Install Homebrew

Think of Homebrew as a package manager for the command line. Everything Jekyll
needs from it is free and open source.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

The installer does not put `brew` on your PATH by itself. Do that, then make the
macOS SDK visible to native extension builds:

```bash title="~/.zprofile"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
export SDKROOT=$(xcrun --show-sdk-path)
```

## Install Ruby

macOS ships a Ruby, and its gems are locked down, which is why you install a
second one rather than fighting the first.

```bash
ruby -v              # the system Ruby
brew install ruby    # the one you will actually use
```

Homebrew keeps its Ruby off the default PATH deliberately, so your shell will
keep preferring the system copy until you say otherwise. Check which shell you
are in:

```bash
echo $SHELL
```

That prints a path, something like `/bin/zsh` or `/bin/bash`. The PATH entry is
the same either way; only the file you append it to changes. For zsh:

```bash title="~/.zshrc"
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
```

For bash:

```bash title="~/.bash_profile"
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.bash_profile
```

Start a fresh shell so the edit takes effect, then check again:

```bash
exec $SHELL
ruby -v
```

The version should no longer match the system one.

## Install Bundler and Jekyll

```bash
gem install --user-install bundler jekyll
```

`--user-install` puts the gems under your home directory, and that directory
needs a PATH entry of its own. The folder is named after the Ruby minor version,
so look before you paste:

```bash
ls ~/.gem/ruby
```

Then, for zsh:

```bash title="~/.zshrc"
# Swap 3.1.0 for whatever the previous command printed.
# [!code word:3.1.0]
echo 'export PATH="$HOME/.gem/ruby/3.1.0/bin:$PATH"' >> ~/.zshrc
```

Finally, check that the gem environment agrees with itself:

```bash
gem env
```

Every path under GEM PATHS should point at the Ruby you just installed. One
still pointing at the system Ruby means a PATH edit has not been picked up, and
the fix is another fresh shell rather than another install.

## When it breaks

### libffi or ffi_c missing

```bash
brew install libffi
gem install ffi --user-install
```

> [!WARNING]
> The same error is often answered with `sudo gem install ffi`. Resist it. That
> writes into the system Ruby, which is the installation these steps exist to
> avoid, and the root-owned files it leaves behind are tedious to undo.

### Could not open library 'glib-2.0.0'

```bash
brew install vips
```

## Additional links

* [Jekyll on macOS](https://jekyll.readthedocs.io/en/latest/installation/macos.html)
* [Xcode](https://developer.apple.com/xcode/)
