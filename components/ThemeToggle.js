'use client';
import { useEffect, useState } from 'react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('rb_theme', next);
    } catch (e) {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', next === 'light' ? '#f4f4f7' : '#08080c');
    setTheme(next);
  }

  const Icon = theme === 'light' ? MdDarkMode : MdLightMode;
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={'grid shrink-0 place-items-center transition active:scale-95 ' + className}
    >
      <Icon size={22} />
    </button>
  );
}
