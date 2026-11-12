import {describe,it,expect,beforeEach} from 'vitest';
import {formatPartName,buildPartsData} from '../src/data/anatomy.js';
import {state,setLanguage} from '../src/state/store.js';
import {buildSearchIndex,searchStructures} from '../src/utils/dataLoader.js';
import sk from '../src/data/ui.sk.json';
import en from '../public/data/translations/en.json';

describe('Slovak anatomical mode',()=>{
  beforeEach(()=>{
    state.partsData=buildPartsData({skeletal:['Femur.l','Femur.r','Clavicle.l'],visceral:['Liver']},{Femur:{la:'Os femoris'}});
    state.loadedSystems=['skeletal'];
    buildSearchIndex();
  });
  it('names paired bones without losing their identity or side',()=>{
    expect(formatPartName('Femur.l','sk')).toBe('Stehenná kosť (ľavá strana)');
    expect(state.partsData['Femur.r'].name.sk).toBe('Stehenná kosť (pravá strana)');
    expect(state.partsData['Femur.r'].baseName).toBe('Femur');
    expect(formatPartName('Femur.r','en')).toBe('Femur (right)');
  });
  it('finds the same structure through Slovak, accent-free, English and Latin searches',()=>{
    for(const query of ['stehenná kosť','stehenna kost','femur','os femoris']){
      expect(searchStructures(query)[0].base).toBe('Femur');
    }
    expect(searchStructures('pecen')[0].base).toBe('Liver');
  });
  it('keeps the original label when no curated translation exists',()=>{
    expect(formatPartName('Uncatalogued structure.l','sk')).toBe('Uncatalogued structure (ľavá strana)');
  });
  it('includes every existing interface translation key',()=>{
    expect(Object.keys(en).filter(key=>!sk[key])).toEqual([]);
  });
  it('rejects unsupported languages while preserving SK and IT',()=>{
    setLanguage('sk');setLanguage('unexpected');expect(state.language).toBe('sk');
    setLanguage('it');expect(state.language).toBe('it');
  });
});
