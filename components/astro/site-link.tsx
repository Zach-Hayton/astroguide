import type { ComponentProps } from 'react';

// Document navigation also works before hydration and across Worker deployments.
export default function SiteLink(props: ComponentProps<'a'>) {
  return <a {...props} />;
}
