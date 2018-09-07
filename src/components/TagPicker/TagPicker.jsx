import { splitDataByComponent } from 'utils/split';

import InputPicker from 'components/InputPicker';

export default {
  name: 'TagPicker',

  render() {
    const data = splitDataByComponent(
      {
        splitProps: {
          ...this.$attrs,
          multiple: true,
        },
        scopedSlots: this.$scopedSlots,
        on: this.$listeners,
        ref: 'picker',
      },
      InputPicker
    );

    return (
      <InputPicker {...data}>
        {this.$slots.header && (
          <template slot="header">{this.$slots.header}</template>
        )}
        {this.$slots.placeholder && (
          <template slot="placeholder">{this.$slots.placeholder}</template>
        )}
        {this.$slots.footer && (
          <template slot="footer">{this.$slots.footer}</template>
        )}
      </InputPicker>
    );
  },

  methods: {
    show() {
      this.$refs.picker.show();
    },

    close() {
      this.$refs.picker.close();
    },
  },
};