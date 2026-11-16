'use client'

import { createContext, useContext } from 'react'

// Search state and provider frames stay mounted in inactive categories. Modal
// dialogs must leave the top layer, which is not hidden by an ancestor's hidden.
export const SuchbereichKontext = createContext(true)
export const useSuchbereichAktiv = () => useContext(SuchbereichKontext)
