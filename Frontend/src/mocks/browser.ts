/**
 * MSW Browser Worker
 * ===================
 * Starts the MSW service worker in the browser.
 *
 * Import in your test setup:
 *   import { worker } from '@/mocks/browser';
 *   beforeAll(() => worker.start());
 *   afterAll(() => worker.stop());
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
