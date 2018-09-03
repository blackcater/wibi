import VueTypes from 'vue-types';
import _ from 'lodash';
import popperMixin from 'mixins/popper';
import prefix, { defaultClassPrefix } from 'utils/prefix';
import { getWidth } from 'shares/dom';
import onMenuKeydown from 'shares/onMenuKeydown';
import { vueToString } from 'utils/node';
import { filterNodes, findNode } from 'utils/tree';
import { splitDataByComponent } from 'utils/split';
import getDataGroupBy from 'utils/getDataGroupBy';
import shallowEqual from 'utils/shallowEqual';
import invariant from 'utils/invariant';

import {
  PickerMenuWrapper,
  PickerDropdownMenu,
  PickerToggle,
  getToggleWrapperClassName,
} from 'components/_picker';
import Tag from 'components/Tag';

import InputPickerSearch from './InputPickerSearch.jsx';

const CLASS_PREFIX = 'picker';

export default {
  name: 'InputPicker',

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
      default: 'focus',
    },
    value: VueTypes.any,
    defaultValue: VueTypes.any,
    data: VueTypes.arrayOf(VueTypes.any).def([]),
    cacheData: VueTypes.arrayOf(VueTypes.any).def([]),
    block: VueTypes.bool.def(false),
    disabled: VueTypes.bool.def(false),
    disabledItemValues: VueTypes.arrayOf(VueTypes.any).def([]),
    maxHeight: VueTypes.number.def(320),
    valueKey: VueTypes.string.def('value'),
    labelKey: VueTypes.string.def('label'),
    groupBy: VueTypes.any,
    placeholder: VueTypes.string, // slot
    searchable: VueTypes.bool,
    cleanable: VueTypes.bool,
    creatable: VueTypes.bool.def(false),
    multiple: VueTypes.bool.def(false),
    menuClassName: VueTypes.string,
    menuStyle: VueTypes.object,
    toggleComponentClass: VueTypes.oneOfType([
      VueTypes.string,
      VueTypes.object,
    ]),
    renderMenu: Function,
    renderMenuItem: Function,
    renderMenuGroup: Function,
    renderValue: Function,
    classPrefix: VueTypes.string.def(defaultClassPrefix(CLASS_PREFIX)),
    // change, select, search, toggle
  },

  data() {
    const initVal = _.isUndefined(this.value) ? this.defaultValue : this.value;

    invariant.not(
      this.groupBy === this.valueKey || this.groupBy === this.labelKey,
      '`groupBy` can not be equal to `valueKey` and `labelKey`'
    );

    return {
      innerVal: this.multiple ? initVal || [] : initVal,
      searchKeyword: '',
      focusItemValue: this.multiple ? (initVal || [])[0] : initVal,
      newData: [],
      maxWidth: 100,
    };
  },

  computed: {
    currentVal() {
      return _.isUndefined(this.value) ? this.innerVal : this.value;
    },

    dataList() {
      return [].concat(this.data || [], this.newData || []);
    },

    dataWithCacheList() {
      return [].concat(this.dataList, this.cacheData || []);
    },

    focusableDataList() {
      let filteredData = filterNodes(this.dataList, item =>
        this._shouldDisplay(item[this.labelKey])
      );

      if (
        this.creatable &&
        this.searchKeyword &&
        !findNode(
          this.dataList,
          item => item[this.labelKey] === this.searchKeyword
        )
      ) {
        filteredData.push(this._createOption(this.searchKeyword));
      }

      if (this.groupBy) {
        filteredData = getDataGroupBy(filteredData, this.groupBy);
      }

      return filteredData;
    },
  },

  mounted() {
    const reference = this.$refs.reference;

    if (reference) {
      this.maxWidth = getWidth(reference);
    }
  },

  render(h) {
    const { isValid, displayElement } = this._renderSingleValue(h);
    const tags = this._renderMultiValue(h);
    const hasValue = this.multiple ? !!_.get(tags, 'length') : isValid;
    const searching = !!this.searchKeyword && this.currentVisible;
    const displaySearchInput = this.searchable && !this.disabled;
    const referenceData = {
      class: getToggleWrapperClassName(
        'input',
        this._addPrefix,
        this,
        hasValue,
        {
          [this._addPrefix('tag')]: this.multiple,
          [this._addPrefix('focused')]: this.currentVisible,
        }
      ),
      directives: [{ name: 'click-outside', value: this._handleClickOutside }],
      attrs: { tabindex: -1, role: 'menu' },
      on: { click: this._handleClick, keydown: this._handleKeydown },
      ref: 'reference',
    };
    const wrapperData = {
      class: this._addPrefix('tag-wrapper'),
    };
    const toggleData = splitDataByComponent(
      {
        splitProps: {
          ...this.$attrs,
          hasValue,
          cleanable: this.cleanable && !this.disabled,
          componentClass: this.toggleComponentClass,
        },
        on: {
          clean: this._handleClean,
        },
      },
      PickerToggle
    );
    const popperData = {
      directives: [
        {
          name: 'show',
          value: this.currentVisible,
        },
        { name: 'transfer-dom' },
      ],
      attrs: {
        'data-transfer': `${this.transfer}`,
      },
      ref: 'popper',
    };

    this._addTriggerListeners(wrapperData, wrapperData);

    return (
      <div {...referenceData}>
        <PickerToggle {...toggleData}>
          {searching || (this.multiple && hasValue)
            ? null
            : displayElement || this.$t('_.InputPicker.placeholder')}
        </PickerToggle>
        <div {...wrapperData}>
          {tags}
          {displaySearchInput && this._renderInputSearch(h)}
        </div>
        <transition name="picker-fade">
          {this._renderDropdownMenu(h, popperData)}
        </transition>
      </div>
    );
  },

  methods: {
    _renderDropdownMenu(h, popperData) {
      const menuClassPrefix = this._addPrefix(
        this.multiple ? 'check-menu' : 'select-menu'
      );

      popperData = _.merge(popperData, {
        class: [this.menuClassName, menuClassPrefix],
        style: this.menuStyle,
        on: { keydown: this._handleKeydown },
      });

      const menuData = splitDataByComponent(
        {
          splitProps: {
            data: this.focusableDataList,
            group: !_.isUndefined(this.groupBy),
            checkable: this.multiple,
            maxHeight: this.maxHeight,
            valueKey: this.valueKey,
            labelKey: this.labelKey,
            disabledItemValues: this.disabledItemValues,
            activeItemValues: this.multiple
              ? this.currentVal
              : [this.currentVal],
            focusItemValue: this.focusItemValue,
            renderMenuGroup: this.renderMenuGroup,
            renderMenuItem: this._renderMenuItem,
            dropdownMenuItemClassPrefix: `${menuClassPrefix}-item`,
            classPrefix: menuClassPrefix,
          },
          on: { select: this._handleSelect },
          ref: 'menu',
        },
        PickerDropdownMenu
      );
      const menu = this.focusableDataList.length ? (
        <PickerDropdownMenu {...menuData} />
      ) : (
        <div class={this._addPrefix('none')}>
          {this.$t('_.InputPicker.noResultsText')}
        </div>
      );

      return (
        <PickerMenuWrapper {...popperData}>
          {this.$slots.header}
          {this.renderMenu ? this.renderMenu(h, menu) : menu}
          {this.$slots.footer}
        </PickerMenuWrapper>
      );
    },

    _renderMenuItem(h, label, item) {
      const newLabel = item.create ? (
        <span>{this.$t('_.InputPicker.createOption', [label])}</span>
      ) : (
        label
      );

      return this.renderMenuItem
        ? this.renderMenuItem(h, newLabel, item)
        : newLabel;
    },

    _renderInputSearch() {
      const data = splitDataByComponent(
        {
          splitProps: {
            value: this.currentVisible ? this.searchKeyword : '',
            inputStyle: { maxWidth: `${this.maxWidth - 63}px` },
          },
          on: {
            change: this._handleSearch,
          },
          ref: 'search',
        },
        InputPickerSearch
      );

      return <InputPickerSearch {...data} />;
    },

    _renderMultiValue(h) {
      if (!this.multiple) return null;

      const tags = this.currentVal || [];

      return tags
        .map((tag, index) => {
          const { isValid, displayElement, activeItem } = this._getLabelByValue(
            h,
            tag
          );

          if (!isValid) return null;

          return (
            <Tag
              key={index}
              closable={!this.disabled}
              title={_.isString(displayElement) ? displayElement : undefined}
              onClose={event => this._handleRemoveItem(activeItem, tag, event)}
            >
              {displayElement}
            </Tag>
          );
        })
        .filter(item => !!item);
    },

    _renderSingleValue(h) {
      return this._getLabelByValue(h, this.currentVal);
    },

    _getLabelByValue(h, value) {
      const activeItem = findNode(this.dataWithCacheList, item =>
        shallowEqual(item[this.valueKey], value)
      );
      let displayElement = this.placeholder;

      if (_.get(activeItem, this.labelKey)) {
        displayElement = _.get(activeItem, this.labelKey);

        if (this.renderValue) {
          displayElement = this.renderValue(h, value, activeItem);
        }
      }

      return { activeItem, isValid: !!activeItem, displayElement };
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
      if (this.groupBy) {
        return {
          create: true,
          [this.groupBy]: this.$t('_.InputPicker.newItem'),
          [this.valueKey]: value,
          [this.labelKey]: value,
        };
      }

      return {
        create: true,
        [this.valueKey]: value,
        [this.labelKey]: value,
      };
    },

    _setVal(val, item, event) {
      this.innerVal = val;

      this.$emit('change', val, event);
      this.$emit('select', val, item, event);
    },

    _handleClick() {
      this.$refs.search && this.$refs.search.focus();
    },

    _handleKeydown(event) {
      event.stopPropagation();

      onMenuKeydown(event, {
        down: this._handleFocusNext,
        up: this._handleFocusPrev,
        enter: this._handleFocusCurrent,
        del: this.multiple && !this.searchKeyword ? this._handleFocusDel : null,
        esc: this._closePopper,
      });
    },

    _walkFocusItem(list, fn, offset = 0) {
      const len = list.length;

      for (let i = offset; i < len; i++) {
        const item = list[i];
        let res;

        if (item.children) {
          const pList = i - 1 < 0 ? [] : list[i - 1].children;
          const nList = i + 1 >= len ? [] : list[i + 1].children;

          res = this._walkFocusItem(
            [].concat(pList, item.children, nList),
            fn,
            pList.length
          );
        } else {
          res = fn && fn(item, i, list) && i;
        }

        if (!_.isNumber(res)) res = -1;
        if (res !== -1) return true;
      }

      return false;
    },

    _handleFocusNext() {
      const focusVal = this.focusItemValue;
      const list = this.focusableDataList;
      let firstItem;
      let nFocusItem;
      let groupItems;

      this._walkFocusItem(list, (x, index, list) => {
        const res = shallowEqual(x[this.valueKey], focusVal);

        if (index === 0 && !firstItem) {
          firstItem = x;
        }

        if (res) {
          groupItems = list;
          nFocusItem = groupItems[index + 1];
        }

        return res;
      });

      if (groupItems && nFocusItem) {
        // find focus item
        this.focusItemValue = nFocusItem[this.valueKey];
      }

      if (!groupItems) {
        this.focusItemValue = firstItem[this.valueKey];
      }

      this.$nextTick(
        () => this.$refs.menu && this.$refs.menu.updateScrollPosition()
      );
    },

    _handleFocusPrev() {
      const focusVal = this.focusItemValue;
      const list = this.focusableDataList;
      let firstItem;
      let nFocusItem;
      let groupItems;

      this._walkFocusItem(list, (x, index, list) => {
        const res = shallowEqual(x[this.valueKey], focusVal);

        if (index === 0 && !firstItem) {
          firstItem = x;
        }

        if (res) {
          groupItems = list;
          nFocusItem = groupItems[index - 1];
        }

        return res;
      });

      if (groupItems && nFocusItem) {
        // find focus item
        this.focusItemValue = nFocusItem[this.valueKey];
      }

      if (!groupItems) {
        this.focusItemValue = firstItem[this.valueKey];
      }

      this.$nextTick(
        () => this.$refs.menu && this.$refs.menu.updateScrollPosition()
      );
    },

    _handleFocusCurrent(event) {
      const focusVal = this.focusItemValue;
      const list = this.focusableDataList;
      let currentItem;

      this._walkFocusItem(list, (x, index, list) => {
        const res = shallowEqual(x[this.valueKey], focusVal);

        if (res) {
          currentItem = x;
        }

        return res;
      });

      if (!currentItem) return;

      this._handleSelect(
        currentItem[this.valueKey],
        currentItem,
        event,
        this.multiple
          ? !this.currentVal.some(x => shallowEqual(x, focusVal))
          : false
      );
    },

    _handleFocusDel(event) {
      if (!this.multiple) return;

      const len = this.currentVal.length;
      const item = this.currentVal[len - 1];

      if (item) this._handleSelect(item[this.valueKey], item, event, false);
    },

    _handleSelect(value, item, event, checked) {
      let newVal = _.cloneDeep(this.currentVal);

      if (this.multiple && checked) {
        // add new item
        newVal.push(value);
      } else if (this.multiple && !checked) {
        // remove old item
        newVal.splice(_.findIndex(newVal, v => shallowEqual(v, value)), 1);
      } else {
        newVal = value;
      }

      // if new create item
      if (item && item.create) {
        delete item.create;

        this.newData.push(item);
      }

      this.focusItemValue = value;

      if (this.multiple) {
        this.searchKeyword = '';
      } else {
        // close popper
        this._closePopper();
      }

      this._setVal(newVal, item, event);
    },

    _handleSearch(val, event) {
      this.searchKeyword = val;

      this.$emit('search', val, event);
    },

    _handleClean(event) {
      if (this.disabled) return;

      this.focusItemValue = null;
      this.searchKeyword = '';

      this._setVal(this.multiple ? [] : null, event);
    },

    _handleRemoveItem(item, tag, event) {
      if (this.disabled) return;

      this._handleSelect(tag, item, event, false);
    },

    _addPrefix(cls) {
      return prefix(this.classPrefix, cls);
    },
  },
};
