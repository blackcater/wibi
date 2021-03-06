### Delay Off

Duration is an optional item. When set to 0, it is not automatically turned off.

```
Alert.info(content: string, duration?: number, onClose?: () => void);
```

<!--start-code-->

```vue
<template>
  <ButtonToolbar>
    <Button @click="_handleOpen(100000)">duration 10s</Button>
    <Button @click="_handleOpenNoLimit">no limit</Button>
  </ButtonToolbar>
</template>

<script>
export default {
  methods: {
    _handleOpen(duration) {
      this.$Alert.success(
        `This is message will be closed after ${duration / 1000}s.`,
        duration,
        { closable: true }
      );
    },

    _handleOpenNoLimit() {
      this.$Alert.open(
        'This is message will not be closed  automatically.',
        0,
        { closable: true }
      );
    },
  },
};
</script>
```

<!--end-code-->
