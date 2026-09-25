import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { FiltersPanel } from '@/components/filters/FiltersPanel';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div className={styles.root}>
      <TopBar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <GlobalSearch />
      <FiltersPanel />
    </div>
  );
}
