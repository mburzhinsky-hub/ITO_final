import assert from 'node:assert/strict';
import { classifySupplierItem, shouldShowByDefault } from '../src/engine/catalogRelevance.js';

function rel(item) { return classifySupplierItem(item).relevance; }

export function runCatalogRelevanceTests() {
  assert.equal(rel({ name: 'Fine pitch LED screen processor', supplier: 'x' }), 'av_core');
  assert.equal(rel({ name: 'Laser Projector 7000 lm', supplier: 'x' }), 'av_core');
  assert.equal(rel({ name: 'PTZ camera for video conference', supplier: 'x' }), 'av_core');
  assert.equal(rel({ name: 'Dante DSP audio processor', supplier: 'x' }), 'av_core');
  assert.equal(rel({ name: 'HDMI cable 10m', supplier: 'x' }), 'av_infrastructure');
  assert.equal(rel({ name: '19 inch rack PDU UPS kit', supplier: 'x' }), 'av_infrastructure');
  assert.equal(rel({ name: 'Intel CPU RAM motherboard bundle', supplier: 'x' }), 'it_related');
  assert.equal(rel({ name: 'Mini PC for signage', supplier: 'x' }), 'av_core');
  assert.equal(rel({ name: 'Cleaning kit and battery set', supplier: 'x' }), 'consumables');
  assert.equal(rel({ name: 'Office chair', supplier: 'x' }), 'hidden');
  assert.equal(rel({ name: 'Чайник электрический', supplier: 'x' }), 'hidden');
  assert.equal(rel({ name: 'ZX-unknown universal item', supplier: 'x' }), 'questionable');
  assert.equal(shouldShowByDefault({ name: 'PTZ camera', supplier: 'x' }), true);
  assert.equal(shouldShowByDefault({ name: 'HDMI cable', supplier: 'x' }), true);
  assert.equal(shouldShowByDefault({ name: 'Intel CPU', supplier: 'x' }), false);
  assert.equal(shouldShowByDefault({ name: 'Office chair', supplier: 'x' }), false);
  console.log('Catalog relevance tests passed.');
}
