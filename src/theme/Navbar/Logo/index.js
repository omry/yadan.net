import React from 'react';
import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import Logo from '@theme/Logo';

export default function NavbarLogo() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <Logo
      className={clsx('navbar__brand', isHome && 'navbar__brand--active')}
      imageClassName="navbar__logo"
      titleClassName="navbar__title text--truncate"
    />
  );
}
