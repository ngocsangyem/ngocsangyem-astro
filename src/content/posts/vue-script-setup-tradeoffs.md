---
title: "script setup is the cool part of Vue, but keep a plain script around"
date: 2022-06-19
tags: ["vue", "javascript"]
description: "Why a single-file component sometimes still wants a plain script block beside script setup, and the reason Vue 3.3 took off that list."
---

`<script setup>` compiles into the component's `setup()` function, so its body
runs once per component instance. A plain `<script>` block in the same file
behaves differently: it runs in module scope, once, the first time the module is
imported. That difference is the whole reason to keep both around.

## Code that should run once

Anything that must happen a single time for the module belongs in the plain
block. Put it in `<script setup>` and it runs again for every instance you mount.

```vue title="src/components/Chart.vue"
<script>
// Module scope. Runs once, when this file is first imported.
registerChartPlugin();
</script>

<script setup>
// setup() scope. Runs for every instance.
const props = defineProps(['data']);
</script>
```

## Named exports

`<script setup>` has no syntax for exporting anything but the component itself,
so a file that needs to hand out a second value needs the plain block:

```vue title="src/components/Field.vue"
<script>
export const FIELD_SIZES = ['sm', 'md', 'lg'];
</script>

<script setup>
defineProps({ size: { type: String, default: 'md' } });
</script>
```

## The options escape hatch, now mostly retired

The original reason for pairing the two blocks was options with no Composition
API equivalent, and `inheritAttrs` was the example everyone reached for:

```vue
<script>
export default {
  inheritAttrs: false,
};
</script>

<script setup>
defineProps(['label', 'value']);
</script>
```

Vue 3.3 added `defineOptions`, which takes that case over and leaves one block:

```vue title="src/components/Input.vue"
<script setup>
defineOptions({ inheritAttrs: false });
defineProps(['label', 'value']);
</script>
```

> [!NOTE]
> `defineOptions` needs Vue 3.3 or newer. On anything older, the plain `<script>`
> block is still how you set `inheritAttrs`.

> [!WARNING]
> `defineOptions` is compiled away, so its argument is hoisted and cannot
> reference local variables that are not literals.

Two things Vue's own documentation warns against, both easy to drift into once
you have two blocks open. Do not restate options in the plain block when
`<script setup>` already supports them, and do not reach into `<script setup>`
bindings from an Options API block in the same file.

## Additional links

* [Vue SFC: script setup](https://vuejs.org/api/sfc-script-setup.html)
* [@MichaelThiessen](https://twitter.com/MichaelThiessen)
