export default function tripStatusColor(status){

switch(status){

case "scheduled":
return "#F59E0B";

case "boarding":
return "#F97316";

case "on_route":
return "#2563EB";

case "arriving":
return "#8B5CF6";

case "completed":
return "#22C55E";

case "cancelled":
return "#EF4444";

default:
return "#94A3B8";

}

}