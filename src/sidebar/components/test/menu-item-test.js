import { mount } from 'enzyme';
import { createElement } from 'preact';

import MenuItem from '../menu-item';
import { $imports } from '../menu-item';

import { checkAccessibility } from '../../../test-util/accessibility';
import mockImportedComponents from '../../../test-util/mock-imported-components';

describe('MenuItem', () => {
  const createMenuItem = props =>
    mount(<MenuItem label="Test item" {...props} />);

  beforeEach(() => {
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('invokes `onClick` callback when clicked', () => {
    const onClick = sinon.stub();
    const wrapper = createMenuItem({ onClick });
    wrapper.find('.menu-item__action').simulate('click');
    assert.called(onClick);
  });

  it('renders a link if an `href` is provided', () => {
    const wrapper = createMenuItem({ href: 'https://example.com' });
    const link = wrapper.find('a');
    assert.equal(link.length, 1);
    assert.equal(link.prop('href'), 'https://example.com');
    assert.equal(link.prop('rel'), 'noopener noreferrer');
  });

  it('renders a non-link if an `href` is not provided', () => {
    const wrapper = createMenuItem();
    assert.isFalse(wrapper.exists('a'));
    assert.equal(wrapper.find('.menu-item__label').text(), 'Test item');
  });

  it('renders an `<img>` icon if an icon URL is provided', () => {
    const src = 'https://example.com/icon.svg';
    const wrapper = createMenuItem({ icon: src });
    const icon = wrapper.find('img');
    assert.equal(icon.prop('src'), src);
  });

  it('renders an SVG icon if an icon name is provided', () => {
    const wrapper = createMenuItem({ icon: 'an-svg-icon' });
    assert.isTrue(wrapper.exists('SvgIcon[name="an-svg-icon"]'));
  });

  it('renders a blank space for an icon if `icon` is "blank"', () => {
    const wrapper = createMenuItem({ icon: 'blank' });
    const iconSpace = wrapper.find('.menu-item__icon-container');
    assert.equal(iconSpace.length, 1);
    assert.equal(iconSpace.children().length, 0);
  });

  it('does not render a space for an icon if `icon` is missing', () => {
    const wrapper = createMenuItem();
    const iconSpace = wrapper.find('.menu-item__icon-container');
    assert.equal(iconSpace.length, 0);
  });

  it('shows the submenu indicator if `isSubmenuVisible` is a boolean', () => {
    const wrapper = createMenuItem({
      isSubmenuVisible: true,
    });
    assert.isTrue(wrapper.exists('SvgIcon[name="collapse-menu"]'));

    wrapper.setProps({ isSubmenuVisible: false });
    assert.isTrue(wrapper.exists('SvgIcon[name="expand-menu"]'));
  });

  it('does not show submenu indicator if `isSubmenuVisible` is undefined', () => {
    const wrapper = createMenuItem();
    assert.isFalse(wrapper.exists('SvgIcon'));
  });

  it('calls the `onToggleSubmenu` callback when the submenu toggle is clicked', () => {
    const onToggleSubmenu = sinon.stub();
    const wrapper = createMenuItem({
      isSubmenuVisible: true,
      onToggleSubmenu,
    });
    wrapper.find('.menu-item__toggle').simulate('click');
    assert.called(onToggleSubmenu);
  });

  it('renders top-level menu item icons on the left', () => {
    const wrapper = createMenuItem({ icon: 'an-svg-icon' });
    const iconSpaces = wrapper.find('.menu-item__icon-container');

    // There should be only one icon space, on the left.
    assert.equal(iconSpaces.length, 1);
    assert.equal(iconSpaces.at(0).children().length, 1);
  });

  it('renders submenu item icons on the right', () => {
    const wrapper = createMenuItem({
      icon: 'an-svg-icon',
      isSubmenuItem: true,
    });
    const iconSpaces = wrapper.find('.menu-item__icon-container');
    assert.equal(iconSpaces.length, 2);

    // There should be a space for the parent item's icon.
    assert.equal(iconSpaces.at(0).children().length, 0);

    // The actual icon for the submenu should be shown on the right.
    assert.equal(iconSpaces.at(1).children().length, 1);
  });

  it('does not render submenu content if `isSubmenuVisible` is undefined', () => {
    const wrapper = createMenuItem({});
    assert.isFalse(wrapper.exists('Slider'));
  });

  it('shows submenu content if `isSubmenuVisible` is true', () => {
    const wrapper = createMenuItem({
      isSubmenuVisible: true,
      submenu: <div>Submenu content</div>,
    });
    assert.equal(wrapper.find('Slider').prop('visible'), true);
    assert.equal(
      wrapper
        .find('Slider')
        .children()
        .text(),
      'Submenu content'
    );
  });

  it('hides submenu content if `isSubmenuVisible` is false', () => {
    const wrapper = createMenuItem({
      isSubmenuVisible: false,
      submenu: <div>Submenu content</div>,
    });
    assert.equal(wrapper.find('Slider').prop('visible'), false);

    // The submenu content may still be rendered if the submenu is currently
    // collapsing.
    assert.equal(
      wrapper
        .find('Slider')
        .children()
        .text(),
      'Submenu content'
    );
  });

  describe('accessibility attributes', () => {
    context('when `isSubmenuItem` is truthy', () => {
      it('sets `role="button"` attribute"', () => {
        //  submenu button
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick, isSubmenuItem: true });
        assert.equal(wrapper.find('.menu-item__action').prop('role'), 'button');
      });

      it('does not add the `role` attribute if `onClick` is missing', () => {
        //  submenu link
        const wrapper = createMenuItem({ isSubmenuItem: true });
        assert.equal(
          wrapper.find('.menu-item__action').prop('role'),
          undefined
        );
      });

      it('does not add the `aria-checked` attribute', () => {
        //  submenu button
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick, isSubmenuItem: true });
        assert.equal(
          wrapper.find('.menu-item__action').prop('aria-checked'),
          undefined
        );
      });
    });

    context('when `isSubmenuItem` is falsey', () => {
      it('sets `role="radio"` attribute', () => {
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick });
        assert.equal(wrapper.find('.menu-item__action').prop('role'), 'radio');
      });

      it('sets `aria-checked` to "false" when `isSelected` is missing', () => {
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick });
        assert.equal(
          wrapper.find('.menu-item__action').prop('aria-checked'),
          'false'
        );
      });

      it('sets `aria-checked` to "false" when `isSelected` is `false`', () => {
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick, isSelected: false });
        assert.equal(
          wrapper.find('.menu-item__action').prop('aria-checked'),
          'false'
        );
      });

      it('sets `aria-checked` to "true" when `isSelected` is `true`', () => {
        const onClick = sinon.stub();
        const wrapper = createMenuItem({ onClick, isSelected: true });
        assert.equal(
          wrapper.find('.menu-item__action').prop('aria-checked'),
          'true'
        );
      });
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        // eslint-disable-next-line react/display-name
        content: () => (
          <div role="menu">
            <MenuItem label="Test item" />
          </div>
        ),
      },
      {
        name: 'with link',
        // eslint-disable-next-line react/display-name
        content: () => (
          <div role="menu">
            <MenuItem label="Test" href="https://foobar.com" />
          </div>
        ),
      },
      {
        name: 'with icon',
        // eslint-disable-next-line react/display-name
        content: () => (
          <div role="menu">
            <MenuItem label="Test" icon="an-svg-icon" />
          </div>
        ),
      },
      {
        name: 'with submenu',
        // eslint-disable-next-line react/display-name
        content: () => (
          <div role="menu">
            <MenuItem
              label="Test"
              isSubmenuVisible={true}
              submenu={<div>Submenu content</div>}
            />
          </div>
        ),
      },
    ])
  );
});
