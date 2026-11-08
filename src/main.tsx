import Availability from './features/Availability';


import ErrorBoundary from './components/ErrorBoundary';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './modern.css';
import './upgrade.css';
import './settings.css';
import './messenger.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><Availability><App /></Availability></ErrorBoundary>
  </StrictMode>,
);

import './mobile-reference.css';
import './desktop-reference.css';

import './conversation-details.css';

import './unified-interface.css';

import './mobile-interactions.css';

import './call-screen.css';

import './call-history-media.css';

import './production-polish.css';

import './mobile-status.css';

import './control-fixes.css';
import './reference-enhancements.css';
import './voice-style-refresh.css';

import './official-reference.css';

import './desktop-capture-reference.css';

import './mobile-reference-followup.css';

import './update-panel-polish.css';

import './desktop-sticker-reference.css';

import './audio-palette-polish.css';

import './mobile-reference-nov4.css';

import './mobile-voice-correction.css';

import './mobile-layout-review.css';

import './contact-interface-polish.css';
import './chat-interface-refinement.css';

import './voice-reference-bars.css';

import './fullscreen-polish.css';
import './features/release-notice.css';

import './layout-audit-polish.css';


import './features/reaction-notice-polish.css';

import './features/desktop-composer-reference.css';

import './features/mobile-contact-info.css';

import './features/mobile-voice-reference.css';

import './features/mobile-message-reference.css';
