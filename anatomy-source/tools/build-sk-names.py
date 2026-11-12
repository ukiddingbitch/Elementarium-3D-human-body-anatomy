from pathlib import Path
import json,re,functools
ROOT=Path(__file__).resolve().parents[1]
known={}
for line in (ROOT/'localization/anatomy-curated.tsv').read_text(encoding='utf-8').splitlines():
    if line.strip():
        key,nom,gen=line.split('|');known[re.sub(r'^\((.*)\)$',r'\1',key).lower()]=(nom,gen)
adj={}
for row in '''anterior=predný;posterior=zadný;superior=horný;inferior=dolný;lateral=bočný;medial=mediálny;middle=stredný;intermediate=prostredný;deep=hlboký;superficial=povrchový;internal=vnútorný;external=vonkajší;common=spoločný;accessory=prídavný;transverse=priečny;longitudinal=pozdĺžny;oblique=šikmý;vertical=zvislý;horizontal=vodorovný;basal=bazálny;apical=hrotový;segmental=segmentový;anterior basal=predný bazálny;posterior basal=zadný bazálny;cutaneous=kožný;articular=kĺbový;muscular=svalový;dorsal=chrbtový;palmar=dlaňový;plantar=chodidlový;digital=prstový;interdigital=medziprstový;metacarpal=záprstný;metatarsal=predpriehlavkový;carpal=zápästný;tarsal=priehlavkový;interosseous=medzikostný;intercostal=medzirebrový;intervertebral=medzistavcový;radial=vretenný;ulnar=lakťový;humeral=ramenný;brachial=ramenný;antebrachial=predlakťový;axillary=pazuchový;subscapular=podlopatkový;scapular=lopatkový;suprascapular=nadlopatkový;thoracic=hrudníkový;pectoral=prsný;abdominal=brušný;lumbar=driekový;sacral=krížový;coccygeal=kostrčový;cervical=krčný;iliac=bedrový;iliolumbar=bedrovodriekový;ilio-inguinal=bedrovoslabinový;inguinal=slabinový;gluteal=sedací;femoral=stehenný;popliteal=zákolenný;tibial=píšťalový;fibular=ihlicový;sural=lýtkový;calcaneal=pätový;frontal=čelový;parietal=temenný;temporal=spánkový;occipital=záhlavný;orbital=očnicový;supraorbital=nadočnicový;infraorbital=podočnicový;nasal=nosový;ethmoidal=čuchový;sphenoidal=klinový;zygomatic=jarmový;facial=tvárový;buccal=lícny;mandibular=sánkový;maxillary=čeľustný;mental=bradový;alveolar=alveolárny;palatine=podnebný;lingual=jazykový;sublingual=podjazykový;submental=podbradový;submandibular=podsánkový;parotid=príušný;lacrimal=slzný;meningeal=mozgovoblanový;cerebral=mozgový;cerebellar=mozočkový;spinal=miechový;vertebral=stavcový;retinal=sietnicový;optic=zrakový;olfactory=čuchový;oculomotor=okohybný;vestibular=predsieňový;cochlear=slimákový;tympanic=bubienkový;auricular=ušnicový;subclavian=podkľúčny;carotid=krčný;jugular=hrdlový;pulmonary=pľúcny;bronchial=prieduškový;oesophageal=pažerákový;gastric=žalúdočný;gastro-omental=žalúdkovopredsterový;pancreatic=pankreatický;duodenal=dvanástnikový;pancreaticoduodenal=pankreatickodvanástnikový;hepatic=pečeňový;cystic=žlčníkový;splenic=slezinový;renal=obličkový;suprarenal=nadobličkový;ureteric=močovodový;urethral=uretrálny;vesical=mechúrový;testicular=semenníkový;prostatic=prostatický;rectal=konečníkový;anal=análny;pudendal=ohanbový;mesenteric=okružový;colic=tračníkový;ileocolic=bedrovníkovohrubočrevný;jejunal=lačníkový;ileal=bedrovníkový;appendicular=apendikulárny;sigmoid=esovitý;coronary=vencový;cardiac=srdcový;pericardiac=osrdcovníkový;pericardial=osrdcovníkový;aortic=aortový;interventricular=medzikomorový;atrioventricular=predsieňovokomorový;interatrial=medzipredsieňový;phrenic=bráničný;diaphragmatic=bráničný;thyroid=štítny;laryngeal=hrtanový;tracheal=priedušnicový;pharyngeal=hltanový;tonsillar=mandľový;collateral=bočný;recurrent=návratný;communicating=spojovací;circumflex=obtočný;ascending=vzostupný;descending=zostupný;recurrent=návratný;recurrent=návratný;short=krátky;long=dlhý;greater=veľký;lesser=malý;great=veľký;small=malý;large=veľký;annular=prstencový;cruciate=skrížený;cruciform=krížový;spiral=špirálový;round=okrúhly;oval=oválny;straight=priamy;free=voľný;proper=vlastný;central=centrálny;peripheral=periférny;proximal=proximálny;distal=distálny;obturator=upchávajúci;inguinal=slabinový;supraclavicular=nadkľúčny;infraclavicular=podkľúčny;parasternal=prihrudníkový;paratracheal=pripriedušnicový;retropharyngeal=retrofaryngeálny;retropyloric=zapylorický;subpyloric=podpylorický;suprapyloric=nadpylorický;epigastric=nadbruškový;submandibular=podsánkový;submental=podbradový;right=pravý;left=ľavý'''.split(';'):
    key,value=row.split('=');adj[key]=value

for en,nom,gen in [('hand','ruka','ruky'),('foot','noha','nohy'),('forearm','predlaktie','predlaktia'),('arm','rameno','ramena'),('thigh','stehno','stehna'),('leg','predkolenie','predkolenia'),('wrist','zápästie','zápästia'),('ankle','členok','členka'),('neck','krk','krku'),('head','hlava','hlavy'),('nasal septal cartilage','chrupavka nosovej priehradky','chrupavky nosovej priehradky'),('brachial plexus','ramenný pletenec','ramenného pletenca'),('spinal nerve','miechový nerv','miechového nervu'),('middle meningeal artery','stredná mozgovoblanová tepna','strednej mozgovoblanovej tepny'),('saphenous nerve','skrytý nerv','skrytého nervu'),('sympathetic trunk','sympatický kmeň','sympatického kmeňa')]:known[en]=(nom,gen)
for row in 'genicular=kolenný;labial=perový;ophthalmic=očnicový;papillary=bradavkový;parathyroid=prištítny;petrosal=skalný;sagittal=šípový;salivatory=slinný;tracheobronchial=priedušnicovoprieduškový;splanchnic=útrobný;lymphatic=miazgový;venous=žilový;arterial=tepnový;neural=nervový;perforating=prevŕtavajúci;intermuscular=medzisvalový;subcutaneous=podkožný;infrapatellar=podjabĺčkový;suprapatellar=nadjabĺčkový;recurrent=návratný;terminal=koncový;interlobar=medzilalokový;lobar=lalokový;paracentral=paracentrálny;precentral=predcentrálny;postcentral=pocentrálny;intraparietal=vnútrotemenný;transversospinal=priečnostavcový;recurrent=návratný;sacrococcygeal=krížovokostrčový;interspinous=medzitŕňový;intertransverse=medzipriečny;supraspinous=nadtŕňový;infraspinous=podtŕňový;iliac=bedrový;acetabular=jamkový;suprarenal=nadobličkový;supramarginal=nadokrajový;intertubercular=medzihrbolčekový;intercapitular=medzihlavičkový;recurrent=návratný;coracoclavicular=zobákovokľúčny;acromioclavicular=nadpleckovokľúčny;sternoclavicular=hrudníkovokľúčny;costoclavicular=rebrovokľúčny;costotransverse=rebrovopriečny;costovertebral=rebrovostavcový'.split(';'):
    a,b=row.split('=');adj[a]=b

nouns={}
for row in '''artery|tepna|tepny|f;arteries|tepny|tepien|p;vein|žila|žily|f;veins|žily|žíl|p;nerve|nerv|nervu|m;nerves|nervy|nervov|p;muscle|sval|svalu|m;muscles|svaly|svalov|p;ligament|väz|väzu|m;ligaments|väzy|väzov|p;bone|kosť|kosti|f;node|miazgová uzlina|miazgovej uzliny|f;nodes|miazgové uzliny|miazgových uzlín|p;branch|vetva|vetvy|f;branches|vetvy|vetiev|p;part|časť|časti|f;parts|časti|častí|p;head|hlava|hlavy|f;heads|hlavy|hláv|p;body|telo|tela|n;nucleus|jadro|jadra|n;gyrus|závit|závitu|m;sulcus|ryha|ryhy|f;gland|žľaza|žľazy|f;glands|žľazy|žliaz|p;bronchus|prieduška|priedušky|f;cartilage|chrupavka|chrupavky|f;disc|platnička|platničky|f;trunk|kmeň|kmeňa|m;plexus|pletenec|pletenca|m;sinus|sínus|sínusu|m;arch|oblúk|oblúka|m;segment|segment|segmentu|m;segments|segmenty|segmentov|p;joint|kĺb|kĺbu|m;joints|kĺby|kĺbov|p;septum|priehradka|priehradky|f;commissure|spojka|spojky|f;layer|vrstva|vrstvy|f;surface|plocha|plochy|f;root|koreň|koreňa|m;roots|korene|koreňov|p;chamber|komora|komory|f;ventricle|komora|komory|f;fissure|štrbina|štrbiny|f;fossa|jama|jamy|f;canal|kanál|kanála|m;duct|vývod|vývodu|m;membrane|blana|blany|f;capsule|puzdro|puzdra|n;tendon|šľacha|šľachy|f;tendons|šľachy|šliach|p;sheath|pošva|pošvy|f;bursa|burza|burzy|f;fascia|pokrývka|pokrývky|f;tract|dráha|dráhy|f;lobe|lalok|laloka|m;lobule|lalôčik|lalôčika|m;peduncle|ramienko|ramienka|n'''.split(';'):
    key,nom,gen,gender=row.split('|');nouns[key]=(nom,gen,gender)
def inflect(word,gender,case):
    if word.endswith('ý') or word.endswith('y'):
        stem=word[:-1]
        return stem+({'m':('ý','ého'),'f':('á','ej'),'n':('é','ého'),'p':('é','ých')}[gender][case])
    return word
@functools.lru_cache(None)
def translate(text):
    text=text.lower().strip()
    if text in known:return known[text]
    parenthetical=re.match(r'^(.+?)\s*(\([^)]*\))$',text)
    if parenthetical:
        stem,extra=parenthetical.groups();translated=translate(stem)
        if translated:
            inner=translate(extra[1:-1]);suffix=' ('+(inner[0] if inner else extra[1:-1].upper() if re.fullmatch(r'[ivx]+',extra[1:-1]) else extra[1:-1])+')'
            return(translated[0]+suffix,translated[1]+suffix)
    if ' of ' in text:
        left,right=text.split(' of ',1);a=translate(left);b=translate(right)
        if a and b:return(a[0]+' '+b[1],a[1]+' '+b[1])
    words=text.split()
    if words and words[-1] in nouns:
        nom,gen,gender=nouns[words[-1]]
        if all(word in adj for word in words[:-1]):
            return (' '.join([*(inflect(adj[w],gender,0) for w in words[:-1]),nom]),' '.join([*(inflect(adj[w],gender,1) for w in words[:-1]),gen]))
    return None
ordinals=['prvé','druhé','tretie','štvrté','piate','šieste','siedme','ôsme','deviate','desiate','jedenáste','dvanáste']
english=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth']
systems=json.loads((ROOT/'public/data/systems.json').read_text())
names=sorted(set(re.sub(r'\.[lr]$','',name) for group in systems.values() for name in group))
result={key:nom[0].upper()+nom[1:] for key,(nom,gen) in known.items()};fallback=[]
for name in names:
    clean=re.sub(r'^\((.*)\)$',r'\1',name).strip()
    translated=translate(clean)
    if re.match(r'^Vertebra [CTL]\d+$',clean):translated=(clean.replace('Vertebra','Stavec'),'')
    for i,en in enumerate(english):
        if clean==en+' rib':translated=(ordinals[i].capitalize()+' rebro','')
        for kind,sk in [('metacarpal bone','záprstná kosť'),('metatarsal bone','predpriehlavková kosť')]:
            if clean==en+' '+kind:translated=(["Prvá","Druhá","Tretia","Štvrtá","Piata"][i]+' '+sk,'') if i<5 else translated
    finger=re.match(r'^(Proximal|Middle|Distal) phalanx of (first|second|third|fourth|fifth) finger of (hand|foot)$',clean)
    if finger:
        loc,num,limb=finger.groups();translated=({'Proximal':'Základný','Middle':'Stredný','Distal':'Koncový'}[loc]+' článok '+{'first':'prvého','second':'druhého','third':'tretieho','fourth':'štvrtého','fifth':'piateho'}[num]+' prsta '+{'hand':'ruky','foot':'nohy'}[limb],'')
    if translated:
        label=translated[0];result[name]=label[0].upper()+label[1:]
    else:fallback.append(name)
(ROOT/'src/data/names.sk.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'localization/untranslated.txt').write_text('\n'.join(fallback),encoding='utf-8')
print(f'{len(names)-len(fallback)}/{len(names)} current base terms covered; original EN retained for remaining specialized terms.')
