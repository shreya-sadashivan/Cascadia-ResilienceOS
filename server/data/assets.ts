import type { InfrastructureAsset, DependencyEdge, NetworkModel, AssetCategory } from "../types/infrastructure";

const districts = ["Central", "North", "East", "West", "South", "Industrial"];

const rawData: Array<[string, string, AssetCategory, string, number, number, number, number, number, number, boolean, number]> = [
  ["power_central","Central Grid Substation","power","Central",12.9716,77.5946,450,78,640000,36,true,96],
  ["power_east","East Grid Substation","power","East",13.0040,77.6400,280,71,310000,30,true,88],
  ["power_west","West Grid Substation","power","West",12.9650,77.5450,300,69,280000,30,true,86],
  ["power_north","North Grid Substation","power","North",13.0350,77.5850,250,73,240000,28,true,82],
  ["solar","Urban Solar Generation","power","South",12.9150,77.6100,120,52,150000,12,false,61],
  ["backup_gen","Critical Backup Generation","power","Central",12.9780,77.5850,90,25,180000,8,true,74],

  ["water_treatment","Central Water Treatment Plant","water","Industrial",12.9900,77.5600,520,76,610000,60,true,91],
  ["water_intake","Raw Water Intake","water","West",12.9450,77.5200,600,73,700000,54,true,84],
  ["reservoir_central","Central Reservoir","water","Central",12.9750,77.5750,400,69,430000,42,true,82],
  ["reservoir_east","East Reservoir","water","East",13.0000,77.6250,300,62,300000,36,false,68],
  ["reservoir_west","West Reservoir","water","West",12.9600,77.5500,280,64,260000,36,false,66],
  ["pump_a","Central Pumping Station","water","Central",12.9680,77.5850,300,72,390000,30,true,77],
  ["pump_b","East Pumping Station","water","East",13.0100,77.6350,220,67,250000,28,false,63],

  ["ring_road","Ring Road","transport","Central",12.9700,77.5700,9000,68,520000,18,true,87],
  ["north_corridor","North-South Arterial","transport","North",13.0200,77.5800,6000,72,360000,18,true,84],
  ["east_corridor","East-West Corridor","transport","East",12.9950,77.6200,6500,74,410000,20,true,89],
  ["west_corridor","Western Arterial","transport","West",12.9650,77.5500,5200,66,300000,18,false,73],
  ["river_bridge","River Bridge 01","transport","Central",12.9850,77.6000,4200,79,460000,72,true,93],
  ["bridge_02","River Bridge 02","transport","East",12.9800,77.6250,3200,62,280000,60,false,71],
  ["flyover","Central Flyover","transport","Central",12.9750,77.5950,3800,81,340000,48,false,76],
  ["rail_junction","Central Rail Junction","transport","Central",12.9780,77.6100,220,74,390000,48,true,79],
  ["metro_interchange","Metro Interchange","transport","Central",12.9720,77.6050,18000,71,420000,36,false,72],
  ["bus_depot","Central Bus Depot","transport","South",12.9300,77.6000,800,68,210000,24,false,64],

  ["hospital_a","Central Government Hospital","healthcare","Central",12.9755,77.6005,850,78,320000,48,true,94],
  ["hospital_b","District Hospital","healthcare","North",13.0250,77.5850,500,84,210000,42,true,88],
  ["hospital_c","Emergency Trauma Centre","healthcare","East",12.9950,77.6350,420,91,190000,36,true,90],
  ["hospital_d","Private Hospital","healthcare","West",12.9600,77.5450,650,62,180000,36,true,76],
  ["hospital_e","Community Health Centre","healthcare","South",12.9250,77.6100,220,69,95000,24,false,62],

  ["telecom_a","Telecom Tower A","telecom","Central",12.9800,77.5900,100,72,380000,18,true,72],
  ["telecom_b","Telecom Tower B","telecom","East",13.0050,77.6300,100,67,260000,18,false,63],
  ["telecom_c","Telecom Tower C","telecom","West",12.9550,77.5500,100,61,230000,18,false,59],
  ["datacentre","Emergency Data Centre","telecom","Central",12.9700,77.6100,1000,58,620000,24,true,83],
  ["emergency_comms","Emergency Communication Hub","telecom","Central",12.9750,77.5900,100,64,700000,18,true,87],

  ["eoc","Emergency Operations Centre","emergency","Central",12.9730,77.5850,100,68,700000,18,true,92],
  ["fire_a","Fire Station A","emergency","Central",12.9650,77.5850,8,61,190000,12,true,79],
  ["fire_b","Fire Station B","emergency","North",13.0300,77.5750,7,58,150000,12,true,73],
  ["fire_c","Fire Station C","emergency","East",13.0000,77.6350,6,63,140000,12,true,70],
  ["ambulance_a","Ambulance Station A","emergency","Central",12.9680,77.6000,20,64,230000,10,true,81],
  ["ambulance_b","Ambulance Station B","emergency","West",12.9550,77.5450,14,57,160000,10,true,74],
  ["police_control","Police Control Centre","emergency","Central",12.9780,77.5950,100,70,650000,18,true,82],

  ["zone_central","Central Population Zone","population","Central",12.9750,77.6000,1000000,74,260000,0,true,78],
  ["zone_north","North Population Zone","population","North",13.0300,77.5800,1000000,68,230000,0,false,66],
  ["zone_east","East Population Zone","population","East",13.0000,77.6300,1000000,71,280000,0,false,69],
  ["zone_west","West Population Zone","population","West",12.9600,77.5500,1000000,65,210000,0,false,64],
  ["zone_south","South Population Zone","population","South",12.9250,77.6100,1000000,63,180000,0,false,61],
  ["zone_industrial","Industrial Population Zone","population","Industrial",12.9950,77.5550,1000000,59,150000,0,false,58],
];

const raw: Array<Omit<InfrastructureAsset, "status">> = rawData.map(([id,name,category,district,lat,lng,capacity,utilization,populationServed,recoveryHours,criticalService,importance]) => ({
  id, name, category, district, lat, lng, capacity, utilization, populationServed, recoveryHours, criticalService, importance
}));

const edgePairs: Array<[string,string,number,string]> = [
  ["power_central","hospital_a",0.95,"dependency"],["power_central","water_treatment",0.92,"dependency"],
  ["power_central","eoc",0.9,"dependency"],["power_central","datacentre",0.9,"dependency"],
  ["power_east","hospital_c",0.9,"dependency"],["power_east","pump_b",0.82,"dependency"],
  ["power_west","hospital_d",0.88,"dependency"],["power_west","water_treatment",0.65,"dependency"],
  ["power_north","hospital_b",0.9,"dependency"],["solar","power_east",0.5,"supply"],
  ["backup_gen","hospital_a",0.7,"supply"],["backup_gen","eoc",0.7,"supply"],

  ["water_intake","water_treatment",0.95,"supply"],["water_treatment","reservoir_central",0.9,"supply"],
  ["water_treatment","reservoir_east",0.72,"supply"],["reservoir_central","pump_a",0.85,"supply"],
  ["reservoir_east","pump_b",0.85,"supply"],["pump_a","hospital_a",0.8,"dependency"],
  ["pump_b","hospital_c",0.75,"dependency"],["reservoir_west","hospital_d",0.65,"dependency"],

  ["river_bridge","ring_road",0.92,"transport"],["bridge_02","east_corridor",0.82,"transport"],
  ["ring_road","north_corridor",0.7,"transport"],["ring_road","east_corridor",0.82,"transport"],
  ["ring_road","west_corridor",0.8,"transport"],["north_corridor","hospital_b",0.9,"transport"],
  ["east_corridor","hospital_c",0.92,"transport"],["west_corridor","hospital_d",0.9,"transport"],
  ["ring_road","hospital_a",0.86,"transport"],["flyover","ring_road",0.72,"transport"],
  ["rail_junction","metro_interchange",0.62,"transport"],["metro_interchange","hospital_a",0.55,"transport"],
  ["bus_depot","hospital_e",0.58,"transport"],["east_corridor","hospital_a",0.62,"transport"],

  ["telecom_a","eoc",0.9,"dependency"],["telecom_b","eoc",0.55,"dependency"],
  ["telecom_c","eoc",0.5,"dependency"],["datacentre","emergency_comms",0.88,"dependency"],
  ["emergency_comms","ambulance_a",0.85,"dependency"],["emergency_comms","ambulance_b",0.78,"dependency"],
  ["eoc","fire_a",0.82,"dependency"],["eoc","fire_b",0.82,"dependency"],["eoc","fire_c",0.82,"dependency"],
  ["eoc","police_control",0.9,"dependency"],

  ["ring_road","ambulance_a",0.9,"transport"],["west_corridor","ambulance_b",0.85,"transport"],
  ["east_corridor","fire_c",0.88,"transport"],["north_corridor","fire_b",0.88,"transport"],
  ["ring_road","fire_a",0.9,"transport"],["ring_road","ambulance_b",0.62,"transport"],

  ["hospital_a","eoc",0.72,"dependency"],["hospital_b","eoc",0.62,"dependency"],
  ["hospital_c","eoc",0.62,"dependency"],["hospital_d","eoc",0.5,"dependency"],

  ["zone_central","hospital_a",0.9,"dependency"],["zone_north","hospital_b",0.9,"dependency"],
  ["zone_east","hospital_c",0.9,"dependency"],["zone_west","hospital_d",0.9,"dependency"],
  ["zone_south","hospital_e",0.85,"dependency"],["zone_industrial","hospital_a",0.5,"dependency"],
];

const edges: DependencyEdge[] = edgePairs.map(([source,target,strength,type], i) => ({
  id: `edge_${i+1}`, source, target, strength, type: type as DependencyEdge["type"],
  capacity: 100, utilization: 60 + Math.round(strength * 30),
  travelTimeMinutes: type === "transport" ? 8 + Math.round((1-strength)*12) : undefined
}));

export function createNetwork(): NetworkModel {
  return {
    assets: raw.map(a => ({...a, status: "operational" as const})),
    edges: edges.map(e => ({...e}))
  };
}

export const DISTRICTS = districts;
