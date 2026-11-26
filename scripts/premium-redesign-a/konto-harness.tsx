import { createRoot } from 'react-dom/client'

import KontoStart from '@/components/account/KontoStart'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'

const wurzel = typeof document !== 'undefined' ? document.getElementById('root') : null

if (wurzel) {
  createRoot(wurzel).render(
    <WorkspaceShell contentId="account-content">
      <KontoStart name="Beispiel Person" email="beispiel@example.invalid" initiale="B" />
    </WorkspaceShell>,
  )
}
