import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { ToastProvider } from '@/context/ToastContext';
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(LocaleProvider, { children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsx(App, {}) }) }) }) }));
