// The site's regions, as in yaasa templates/index.html's ప్రాంతాలు menu (keep in step):
// [main, [places]], an entry being "id" or ["id", "label"]. The front page's chips are the
// four big ones; a thread's region can be any of these (the new-thread form, step 4).
export const REGIONS = [
  ['ఉత్తరాంధ్ర', ['శ్రీకాకుళం', 'విజయనగరం', 'బొబ్బిలి']],
  ['కోస్తా', ['గోదావరి', 'కృష్ణ', 'నెల్లూరు']],
  ['తెలంగాణ', ['మెదక్', 'సంగారెడ్డి', 'జగిత్యాల', 'నాగర్ కర్నూలు']],
  ['రాయలసీమ', ['చిత్తూరు', 'నంద్యాల', 'కడప', 'అనంతపురం']],
  ['తమిళనాడు', [['హోసూరు', 'హోసూరు Hosuru'], ['సేలం', 'సేలం Selam']]],
  ['ఒడిశా', [['బరంపురం', 'బరంపురం Barampuram']]],
  ['కర్ణాటక', [['కోలార్', 'కోలార్ Kolar'], ['పావుగడ', 'పావుగడ Paavugada']]],
  [['మలేషియా', 'మలేషియా Malaysia'], []],
  [['శ్రీలంక', 'శ్రీలంక Sri Lanka'], []],
]

export const CHIP_REGIONS = ['తెలంగాణ', 'రాయలసీమ', 'కోస్తా', 'ఉత్తరాంధ్ర']

export const regionId = (r) => (Array.isArray(r) ? r[0] : r)
export const regionLabel = (r) => (Array.isArray(r) ? r[1] : r)

// Every region id, main ones and places
export const ALL_REGION_IDS = REGIONS.flatMap(([main, places]) => [regionId(main), ...places.map(regionId)])
