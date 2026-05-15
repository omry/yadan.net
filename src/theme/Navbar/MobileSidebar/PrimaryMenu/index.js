import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';

function useNavbarItems() {
  return useThemeConfig().navbar.items;
}

export default function NavbarMobilePrimaryMenu() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();
  const closeSidebar = () => mobileSidebar.toggle();

  return (
    <ul className="menu__list">
      <NavbarItem
        mobile
        activeBaseRegex="^/$"
        className="mobileShortcut mobileShortcutHome"
        label="Home"
        onClick={closeSidebar}
        to="/"
      />
      {items.map((item, i) => (
        <NavbarItem mobile {...item} onClick={closeSidebar} key={i} />
      ))}
    </ul>
  );
}
