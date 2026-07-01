import assert from 'node:assert/strict';
import { canUseItemInAutoEstimate } from '../src/engine/autoEstimateEligibility.js';

export function runAutoEstimateEligibilityTests() {
  assert.equal(canUseItemInAutoEstimate({ name: 'PTZ camera', supplier: 'x' }).allowed, true);
  assert.equal(canUseItemInAutoEstimate({ name: 'HDMI cable', supplier: 'x' }).allowed, true);
  assert.equal(canUseItemInAutoEstimate({ name: 'Office chair', supplier: 'x' }).allowed, false);
  assert.equal(canUseItemInAutoEstimate({ name: 'ZX-unknown universal item', supplier: 'x' }).allowed, false);
  assert.equal(canUseItemInAutoEstimate({ name: 'Intel CPU', supplier: 'x' }).allowed, false);
  assert.equal(canUseItemInAutoEstimate({ name: 'Mini PC', supplier: 'x', relevance: 'it_related', relevanceScore: 68, relevanceReason: 'test', approvedForAutoEstimate: true }, { requiredCategory: 'media server', zone: { name: 'Media server room' } }).allowed, true);
  assert.equal(canUseItemInAutoEstimate({ name: 'Mini PC', supplier: 'x', relevance: 'it_related', relevanceScore: 68, relevanceReason: 'test', approvedForAutoEstimate: true }, { requiredCategory: 'audio' }).allowed, false);
  console.log('Auto-estimate eligibility tests passed.');
}
