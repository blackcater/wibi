import VueTypes from 'vue-types';
import _ from 'lodash';
import Input from 'components/Input';
import popperMixin from 'mixins/popper';
import onMenuKeydown from 'shares/onMenuKeydown';
import prefix, { defaultClassPrefix } from 'utils/prefix';

import AutoCompleteItem from './AutoCompleteItem.jsx';

const CLASS_PREFIX = 'auto-complete';

export default {
  name: 'AutoComplete',

  model: {
    prop: 'value',
    event: 'change',
  },

  mixins: [popperMixin],

  props: {
    data: VueTypes.arrayOf(
      VueTypes.oneOfType([
        VueTypes.string,
        VueTypes.shape({ label: VueTypes.any, value: VueTypes.any }),
      ])
    ).def([]),
    value: VueTypes.string.def(() => undefined),
    defaultValue: VueTypes.string,
    /* eslint-disable vue/require-prop-types */
    placement: {
      ...popperMixin.props.placement,
      default: 'bottom-start',
    },
    trigger: {
      ...popperMixin.props.trigger,
      default: 'focus',
    },
    disabled: VueTypes.bool.def(false),
    selectOnEnter: VueTypes.bool,
    menuClassName: VueTypes.string,
    renderItem: VueTypes.func,
    classPrefix: VueTypes.string.def(defaultClassPrefix(CLASS_PREFIX)),

    // select
    // menuFocus
  },

  data() {
    const initVal = _.isUndefined(this.value) ? this.defaultValue : this.value;

    return {
      innerVal: initVal,
      focusItemValue: initVal,
    };
  },

  computed: {
    classes() {
      return [
        this.classPrefix,
        {
          [this._addPrefix('disabled')]: this.disabled,
        },
      ];
    },

    popperClasses() {
      return [
        this._addPrefix('menu'),
        this._addPickerPrefix('menu'),
        this.menuClassName,
      ];
    },

    currentVal() {
      return _.isUndefined(this.value) ? this.innerVal : this.value;
    },

    list() {
      return this.data
        .map(item => {
          if (_.isString(item)) {
            return { label: item, value: item };
          }

          if (typeof item === 'object') {
            return item;
          }
        })
        .filter(x => !!x);
    },

    focusableList() {
      if (!this.list) return [];

      return this.list.filter(item => {
        const value = this.currentVal || '';

        if (!_.trim(value)) {
          return false;
        }

        const keyword = value.toLocaleLowerCase();

        return item.label.toLocaleLowerCase().indexOf(keyword) >= 0;
      });
    },
  },

  render(h) {
    const acData = {
      class: this.classes,
      directives: [{ name: 'click-outside', value: this._handleClickOutside }],
      on: {},
      ref: 'container',
    };
    const referenceData = {
      class: this._addPrefix('rel'),
      on: {},
      ref: 'reference',
    };
    const popperData = {
      class: this.popperClasses,
      style: {},
      directives: [
        {
          name: 'show',
          value: this.currentVisible && this.focusableList.length,
        },
        { name: 'transfer-dom' },
      ],
      attrs: {
        'data-transfer': `${this.transfer}`,
      },
      ref: 'popper',
    };

    this._addTriggerListeners(referenceData, acData);

    return (
      <div {...acData}>
        <div {...referenceData}>
          <Input
            disabled={this.disabled}
            value={this.currentVal}
            onChange={this._handleInputChange}
            onKeydown={this._handleInputKeydown}
          />
        </div>
        <transition name="picker-fade">
          {this._renderDropdownMenu(h, popperData)}
        </transition>
      </div>
    );
  },

  methods: {
    _renderDropdownMenu(h, popperData) {
      return (
        <div {...popperData}>
          <ul role="menu">
            {this.focusableList.map(item => (
              <AutoCompleteItem
                key={item.value}
                focus={this.focusItemValue === item.value}
                itemData={item}
                renderItem={this.renderItem}
                onClick={this._handleItemClick}
              >
                {(this.$scopedSlots.item && this.$scopedSlots.item(item)) ||
                  item.label}
              </AutoCompleteItem>
            ))}
          </ul>
        </div>
      );
    },

    _setVal(val, event) {
      this.innerVal = val;
      this.focusItemValue = val;

      this.$emit('change', val, event);
    },

    _openPopper() {
      if (!this.currentVisible) {
        this.$nextTick(() => (this.innerVisible = true));
      }
    },

    _closePopper() {
      if (this.currentVisible) {
        this.$nextTick(() => (this.innerVisible = false));
      }
    },

    _handleItemClick(item, event) {
      const value = item.value;

      this._closePopper();
      this._setVal(value, event);

      this.$emit('select', item, event);
    },

    _handleInputChange(val, event) {
      this._openPopper();
      this._setVal(val, event);
    },

    _handleInputKeydown(event) {
      onMenuKeydown(event, {
        down: this._handleFocusNext,
        up: this._handleFocusPrev,
        enter: this.selectOnEnter ? this._handleFocusCurrent : undefined,
        esc: this._closePopper,
      });

      this.$emit('keydown', event);
    },

    _handleFocusNext() {
      const value = this.focusItemValue || '';
      const list = this.focusableList;

      if (!this.currentVisible) return;
      if (!list.length) return;

      const index = _.findIndex(list, o => o.value === value);
      const curr = index === -1 ? 0 : (index + 1) % list.length;

      this.focusItemValue = list[curr].value;
    },

    _handleFocusPrev() {
      const value = this.focusItemValue || '';
      const list = this.focusableList;

      if (!this.currentVisible) return;
      if (!list.length) return;

      const index = _.findIndex(list, o => o.value === value);
      const curr = index === -1 ? 0 : (index + list.length - 1) % list.length;

      this.focusItemValue = list[curr].value;
    },

    _handleFocusCurrent(event) {
      const value = this.focusItemValue || '';
      const list = this.focusableList;

      if (!this.currentVisible) return;
      if (!list.length) return;

      const index = _.findIndex(list, o => o.value === value);

      if (index === -1) return;

      this._closePopper();
      this._setVal(value, event);
    },

    _addPickerPrefix(cls) {
      return prefix(defaultClassPrefix('picker'), cls);
    },

    _addPrefix(cls) {
      return prefix(this.classPrefix, cls);
    },
  },
};