import { Topbar } from './Topbar';

export const Page = ({ titleEn, titleUr, sub, children }) => (
  <main className="main">
    <Topbar titleEn={titleEn} titleUr={titleUr} sub={sub} />
    {children}
  </main>
);
