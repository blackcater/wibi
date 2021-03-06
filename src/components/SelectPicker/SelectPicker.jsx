import VueTypes from 'vue-types';
import _ from 'lodash';
import popperMixin from 'mixins/popper';
import onMenuKeydown from 'utils/onMenuKeydown';
import prefix, { defaultClassPrefix } from 'utils/prefix';
import { mapNode, findNode, flattenNodes, filterNodes } from 'utils/tree';
import { splitDataByComponent } from 'utils/split';
import { vueToString } from 'utils/node';
import getDataGroupBy from 'utils/getDataGroupBy';
import { findComponentUpward } from 'utils/find';
import shallowEqual from 'utils/shallowEqual';
import invariant from 'utils/invariant';

import { Fade } from 'components/Animation';
import {
  PickerToggle,
  PickerSearchBar,
  PickerMenuWrapper,
  PickerDropdownMenu,
  PickerDropdownMenuItem,
  getToggleWrapperClassName,
} from 'components/_picker';

const CLASS_PREFIX = 'picker';

export default {
  name: 'SelectPicker',

  model: {
    prop: 'value',
    event: 'change',
  },

  mixins: [popperMixin],

  props: {
    /* eslint-disable vue/require-prop-types */
    placement: {
      ...popperMixin.props.placement,
      default: 'bottom-start',
    },
    trigger: {
      ...popperMixin.props.trigger,
      default: 'click',
    },
    value: VueTypes.any,
    defaultValue: VueTypes.any,
    appearance: VueTypes.oneOf(['default', 'subtle']).def('default'),
    data: VueTypes.arrayOf(VueTypes.any).def([]),
    cacheData: VueTypes.arrayOf(VueTypes.any).def([]),
    block: VueTypes.bool.def(false),
    disabled: VueTypes.bool.def(false),
    disabledItemValues: VueTypes.arrayOf(VueTypes.any).def([]),
    maxHeight: VueTypes.number.def(320),
    valueKey: VueTypes.string.def('value'),
    labelKey: VueTypes.string.def('label'),
    groupBy: VueTypes.any,
    placeholder: VueTypes.string,
    searchable: VueTypes.bool,
    cleanable: VueTypes.bool,
    creatable: VueTypes.bool.def(false),
    menuClassName: VueTypes.string,
    menuStyle: VueTypes.object,
    menuAutoWidth: VueTypes.bool,
    sort: Function,
    renderMenu: Function,
    renderMenuItem: Function,
    renderMenuGroup: Function,
    renderValue: Function,
    toggleComponentClass: VueTypes.oneOfType([
      VueTypes.string,
      VueTypes.object,
    ]),
    classPrefix: VueTypes.string.def(defaultClassPrefix(CLASS_PREFIX)),

    // slot-header
    // slot-footer
    // slot-placeholder

    // slot-scope-value
    // slot-scope-menu
    // slot-scope-menu-item
    // slot-scope-menu-group

    // @change
    // @search
    // @group-title-click
    // @show
    // @hide
    // @visible-change
  },

  data() {
    const initVal = _.isUndefined(this.value) ? this.defaultValue : this.value;

    invariant.not(
      this.groupBy === this.valueKey || this.groupBy === this.labelKey,
      '`groupBy` can not be equal to `valueKey` and `labelKey`'
    );

    return {
      innerVal: initVal,
      focusItemValue: initVal,
      searchKeyword: '',
      newData: [],
    };
  },

  computed: {
    currentVal() {
      return _.isUndefined(this.value) ? this.innerVal : this.value;
    },

    rawData() {
      return [].concat(this.data || [], this.newData || []);
    },

    rawDataWithCache() {
      return [].concat(this.rawData, this.cacheData || []);
    },

    dataList() {
      let list = [...this.rawData];
      let filteredList = filterNodes(list, item =>
        this._shouldDisplay(_.get(item, this.labelKey), this.searchKeyword)
      );

      if (
        this.creatable &&
        this.searchKeyword &&
        !findNode(
          filteredList,
          item => _.get(item, this.labelKey) === this.searchKeyword
        )
      ) {
        filteredList.push(this._createOption(this.searchKeyword));
      }

      if (this.groupBy) {
        filteredList = getDataGroupBy(filteredList, this.groupBy, this.sort);
      } else if (this.sort) {
        filteredList = filteredList.sort(this.sort(false));
      }

      return mapNode(filteredList, (data, index, layer, children) => {
        const value = _.get(data, this.valueKey);
        const label = _.get(data, this.labelKey);

        invariant.not(
          _.isUndefined(label),
          `labelKey "${this.labelKey}" is not defined in "data" : ${index}`
        );

        invariant.not(
          _.isUndefined(value) && !children,
          `valueKey "${this.valueKey}" is not defined in "data" : ${index} `
        );

        return {
          key: `${layer}-${
            _.isNumber(value) || _.isString(value) ? value : index
          }`,
          label,
          value,
          data,
          visible: children
            ? children.some(child => child.visible)
            : this._shouldDisplay(label, this.searchKeyword),
        };
      });
    },

    flatDataList() {
      return flattenNodes(this.dataList);
    },
  },

  watch: {
    currentVisible(val) {
      if (val) {
        this.$nextTick(
          () => this.$refs.menu && this.$refs.menu._updateScrollPosition()
        );
      }
    },
  },

  render(h) {
    const { exists, label } = this._getLabelByValue(h, this.currentVal);
    const referenceData = {
      class: getToggleWrapperClassName('select', this._addPrefix, this, exists),
      directives: [{ name: 'click-outside', value: this._handleClickOutside }],
      attrs: { tabindex: -1, role: 'menu' },
      on: { keydown: this._handleKeydown },
      ref: 'reference',
    };
    const toggleData = splitDataByComponent({
      class: this.currentVisible ? 'active' : '',
      splitProps: {
        ...this.$attrs,
        hasValue: exists,
        cleanable: this.cleanable && !this.disabled,
        componentClass: this.toggleComponentClass,
      },
      on: { clean: this._handleClean },
      ref: 'toggle',
    });
    const popperData = {
      directives: [
        { name: 'show', value: this.currentVisible },
        { name: 'transfer-dom' },
      ],
      attrs: { 'data-transfer': `${this.transfer}` },
      ref: 'popper',
    };

    if (!this.disabled) this._addTriggerListeners(toggleData, referenceData);

    return (
      <div {...referenceData}>
        <PickerToggle {...toggleData}>
          {exists
            ? label
            : this.$slots.placeholder ||
              this.placeholder ||
              this.$t('_.Picker.placeholder')}
        </PickerToggle>
        <Fade>{this._renderDropdownMenu(h, popperData)}</Fade>
      </div>
    );
  },

  methods: {
    _renderDropdownMenu(h, popperData) {
      popperData = _.merge(popperData, {
        class: [this._addPrefix('select-menu'), this.menuClassName],
        style: this.menuStyle,
        props: {
          autoWidth: this.menuAutoWidth,
          getToggleInstance: this._getToggleInstance,
        },
        on: { keydown: this._handleKeydown },
      });

      const menuData = splitDataByComponent(
        {
          splitProps: {
            data: this.dataList,
            group: !_.isUndefined(this.groupBy),
            maxHeight: this.maxHeight,
            // valueKey: this.valueKey,
            // labelKey: this.labelKey,
            disabledItemValues: this.disabledItemValues,
            activeItemValues: [this.currentVal],
            focusItemValue: this.focusItemValue,
            renderMenuGroup: this.renderMenuGroup,
            renderMenuItem: this._renderMenuItem,
            dropdownMenuItemClassPrefix: this._addPrefix('select-menu-item'),
            dropdownMenuItemComponentClass: PickerDropdownMenuItem,
            classPrefix: this._addPrefix('select-menu'),
          },
          on: {
            select: this._handleSelect,
            'group-title-click': this._handleGroupTitleClick,
          },
          ref: 'menu',
        },
        PickerDropdownMenu
      );
      const menu = this.dataList.length ? (
        <PickerDropdownMenu {...menuData} />
      ) : (
        <div class={this._addPrefix('none')}>
          {this.$t('_.InputPicker.noResultsText')}
        </div>
      );

      return (
        <PickerMenuWrapper {...popperData}>
          {this.$slots.header}
          {this.searchable && (
            <PickerSearchBar
              placeholder={this.$t('_.Picker.searchPlaceholder')}
              value={this.searchKeyword}
              onChange={this._handleSearch}
              ref="search"
            />
          )}
          {this.$scopedSlots.menu
            ? this.$scopedSlots.menu({ menu })
            : this.renderMenu
            ? this.renderMenu(h, menu)
            : menu}
          {this.$slots.footer}
        </PickerMenuWrapper>
      );
    },

    _renderMenuItem(h, label, data) {
      const newLabel = data.create ? (
        <span>{this.$t('_.InputPicker.createOption', [label])}</span>
      ) : (
        label
      );

      return this.$scopedSlots['menu-item']
        ? this.$scopedSlots['menu-item']({ label: newLabel, data })
        : this.renderMenuItem
        ? this.renderMenuItem(h, newLabel, data)
        : newLabel;
    },

    _getToggleInstance() {
      return this.$refs && this.$refs.toggle;
    },

    _getLabelByValue(h, value) {
      const item = findNode(this.rawDataWithCache, item =>
        shallowEqual(_.get(item, this.valueKey), value)
      );
      let label = _.get(item, this.labelKey);

      if (this.$scopedSlots.value) {
        label = this.$scopedSlots.value({ label, item });
      } else if (this.renderValue) {
        label = this.renderValue(h, label, item);
      }

      return { item, exists: !!item, label };
    },

    _shouldDisplay(label, searchKeyword) {
      const word =
        (_.isUndefined(searchKeyword) ? this.searchKeyword : searchKeyword) ||
        '';

      if (!_.trim(word)) return true;

      const keyword = word.toLocaleLowerCase();

      if (_.isString(label) || _.isNumber(label)) {
        return `${label}`.toLocaleLowerCase().indexOf(keyword) >= 0;
      } else if (_.isObject(label)) {
        return (
          vueToString(label)
            .join('')
            .toLocaleLowerCase()
            .indexOf(keyword) >= 0
        );
      }
    },

    _createOption(value) {
      let data = { create: true };

      _.set(data, this.valueKey, value);
      _.set(data, this.labelKey, value);

      if (this.groupBy) {
        _.set(data, this.groupBy, this.$t('_.InputPicker.newItem'));
      }

      return data;
    },

    _setVal(val, event) {
      this.innerVal = val;

      this.$emit('change', val, event);

      if (findComponentUpward(this, 'FormItem', false)) {
        this.$parent.dispatch('change');
      }
    },

    _handleSelect(value, item, event) {
      const { data } = item;

      // if new create item
      if (data && data.create) {
        delete data.create;

        this.newData.push(data);
      }

      this.focusItemValue = value;
      this.searchKeyword = '';

      // close popper
      this._closePopper();

      this._setVal(value, event);
    },

    _handleGroupTitleClick(event) {
      this.$emit('group-title-click', event);
    },

    _handleSearch(val, event) {
      this.searchKeyword = val;

      this.$emit('search', val, event);
    },

    _handleClean(event) {
      if (this.disabled) return;

      this.focusItemValue = null;
      this.searchKeyword = '';

      this._setVal(null, event);
    },

    _handleKeydown(event) {
      event.stopPropagation();

      onMenuKeydown(event, {
        down: this._handleFocusNext,
        up: this._handleFocusPrev,
        enter: this._handleFocusCurrent,
        del: this._handleFocusDel,
        esc: this._closePopper,
      });
    },

    _handleFocusNext() {
      const val = this.focusItemValue;
      const list = this.flatDataList.filter(
        x =>
          x.visible &&
          !this.disabledItemValues.some(y => shallowEqual(y, x.value))
      );
      const length = list.length;
      const index = _.findIndex(list, x => shallowEqual(x.value, val));

      if (!length) return;
      if (index === -1) this.focusItemValue = list[0] && list[0].value;
      if (index + 1 < length) this.focusItemValue = list[index + 1].value;
    },

    _handleFocusPrev() {
      const val = this.focusItemValue;
      const list = this.flatDataList.filter(
        x =>
          x.visible &&
          !this.disabledItemValues.some(y => shallowEqual(y, x.value))
      );
      const length = list.length;
      const index = _.findIndex(list, x => shallowEqual(x.value, val));

      if (!length) return;
      if (index === -1) this.focusItemValue = list[0] && list[0].value;
      if (index - 1 >= 0) this.focusItemValue = list[index - 1].value;
    },

    _handleFocusCurrent(event) {
      const item = _.find(this.flatDataList, x =>
        shallowEqual(x.value, this.focusItemValue)
      );

      if (!item) return;

      this._handleSelect(item.value, item, event, false);
    },

    _handleFocusDel(event) {
      if (!this.searchKeyword) {
        this._handleClean(event);
      }
    },

    _addPrefix(cls) {
      return prefix(this.classPrefix, cls);
    },
  },
};
