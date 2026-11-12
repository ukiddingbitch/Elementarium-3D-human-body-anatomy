import {state, batchPartStates} from '../state/store.js';
import {hidePart, showPart} from '../viewer/visibility.js';

export function setGroupVisibility(partIds, visible) {
  // Snapshot the requested value before notifications can update the checkbox.
  const requested = Boolean(visible);
  batchPartStates(() => {
    for (const id of partIds) (requested ? showPart : hidePart)(id);
  });
}

export function groupVisibility(partIds, states = state.partStates) {
  const count = partIds.filter(id => states.get(id)?.visible !== false).length;
  return {visible:count > 0, mixed:count > 0 && count < partIds.length};
}
