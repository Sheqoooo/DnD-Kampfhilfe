// Optional styling metadata on the existing editable shape geometry.
export const TERRAIN_TYPES={'tree':['ellipse'],'rock':['room'],'water':['room'],'sand':['room'],'ground-path':['room'],'pier':['rect'],'mountain':['room'],'bridge':['rect'],'ford':['rect'],'clearing':['ellipse'],'trail':['room'],'rubble':['ellipse'],'ruin-floor':['rect'],'ruin-wall':['wall','path'],'cave-floor':['room'],'cave-wall':['room','path']};
export const terrainNames={'tree':'Baum','rock':'Fels','water':'Wasser','sand':'Sandfläche','ground-path':'Pfad','pier':'Holzsteg','mountain':'Bergmassiv','bridge':'Brücke','ford':'Furt','clearing':'Lichtung','trail':'Weg','rubble':'Trümmer','ruin-floor':'Ruinenboden','ruin-wall':'Ruinenwand','cave-floor':'Höhlenboden','cave-wall':'Höhlenwand'};
export const shapeLayer=s=>s.type==='door'?5:['cave-floor','ruin-floor','clearing','sand'].includes(s.terrain)?-3:['water','trail','ground-path'].includes(s.terrain)?-2:['tree','rock','rubble','mountain'].includes(s.terrain)?2:['bridge','ford','pier'].includes(s.terrain)?3:Number(!!s.interior);

// Older forests stored painted helper regions; keep their data but never draw them.
export const isMapShapeVisible=s=>!['clearing','trail'].includes(s.terrain);
