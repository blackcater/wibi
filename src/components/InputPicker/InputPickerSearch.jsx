import VueTypes from 'vue-types';
import _ from 'lodash';
import prefix, { defaultClassPrefix } from 'utils/prefix';
import { splitDataByComponent } from 'utils/split';

import AutosizeInput from 'components/AutosizeInput';

const CLASS_PREFIX = 'picker-search';

export default {
  name: 'InputPickerSearch',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: String,
    classPrefix: VueTypes.string.def(defaultClassPrefix(CLASS_PREFIX)),
    // componentClass: VueTypes.oneOfType([VueTypes.string, VueTypes.object]).def(
    //   'input'
    // ),
  },

  render() {
    const iptData = splitDataByComponent(
      {
        key: 'input',
        class: this._addPrefix('input'),
        splitProps: { ...this.$attrs, value: this.value },
        on: {
          ..._.omit(this.$listeners, ['inputChange']),
          change: this._handleChange,
          input: this._handleInput,
        },
        ref: 'input',
      },
      AutosizeInput
    );

    return (
      <div class={this.classPrefix}>
        <AutosizeInput {...iptData}>{this.$slots.default}</AutosizeInput>
      </div>
    );
  },

  methods: {
    focus() {
      this.$refs.input && this.$refs.input.focus();
    },

    blur() {
      this.$refs.input && this.$refs.input.blur();
    },

    _handleInput(event) {
      const val = event.target.value;

      this.$emit('change', val, event);
    },

    _handleChange(event) {
      this.$emit('inputChange', event);
    },

    _addPrefix(cls) {
      return prefix(this.classPrefix, cls);
    },
  },
};
