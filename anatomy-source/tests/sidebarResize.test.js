import {describe,it,expect} from 'vitest';
import {sidebarBounds,clampSidebarWidth} from '../src/ui/resizeSidebar.js';

describe('Resizable systems panel',()=>{
  it('keeps a usable model viewport on desktop',()=>{
    expect(sidebarBounds(1280)).toEqual({minimum:260,maximum:800});
    expect(clampSidebarWidth(1000,1280)).toBe(800);
    expect(1100-clampSidebarWidth(800,1100)).toBeGreaterThanOrEqual(360);
  });
  it('keeps a compact drawer inside the available screen',()=>{
    expect(clampSidebarWidth(800,430,true)).toBe(406);
    expect(clampSidebarWidth(800,240,true)).toBe(216);
  });
  it('accepts enlarged widths and safely handles bad saved values',()=>{
    expect(clampSidebarWidth(560,1440)).toBe(560);
    expect(clampSidebarWidth(NaN,1440)).toBe(280);
    expect(clampSidebarWidth(-50,1440)).toBe(260);
  });
});
