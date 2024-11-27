function pointArrayToVertexArray(pointArray){
    let returnArray = [];
    for (let i = 0; i < pointArray.length; i++) {
        let point = pointArray[i];
        returnArray.push(point.x,point.y,point.z);
    }
    return returnArray;
}

function isPointConvex(pointMiddle, pointLeft, pointRight){
    let leftVector = Point.subtractByPoint(pointLeft,pointMiddle);
    let rightVector = Point.subtractByPoint(pointRight,pointMiddle);
    let crossProduct = Point.crossProduct2D(rightVector, leftVector);
    return crossProduct >=0;
}

function isPointInTriangle(vertexA,vertexB,vertexC,point){
    let v0 = Point.subtractByPoint(vertexC, vertexA);
    let v1 = Point.subtractByPoint(vertexB, vertexA);
    let v2 = Point.subtractByPoint(point, vertexA);

// Compute dot products
    let dot00 =  Point.dotProduct(v0, v0);
    let dot01 = Point.dotProduct(v0, v1);
    let dot02 = Point.dotProduct(v0, v2);
    let dot11 = Point.dotProduct(v1, v1);
    let dot12 = Point.dotProduct(v1, v2);

// Compute barycentric coordinates
    let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

// Check if point is in triangle
    return (u >= 0) && (v >= 0) && (u + v < 1);
}

function isVerticesFormTriangle(vertexAIndex, vertexBIndex, vertexCIndex,points, pointsIndexList){
    if(!isPointConvex(points[vertexAIndex], points[vertexCIndex],points[vertexBIndex])){
        return false;
    }
    let couldBeTriangle = true;
    for (let j = 0; j < pointsIndexList.length; j++) {
        if (vertexAIndex===pointsIndexList[j] || vertexBIndex===pointsIndexList[j] || vertexCIndex===pointsIndexList[j]){
            continue;
        }
        if (isPointInTriangle(points[vertexAIndex], points[vertexCIndex],points[vertexBIndex],points[pointsIndexList[j]])){
            couldBeTriangle = false;
            break;
        }
    }
    return couldBeTriangle;
}

//this function runs on
function triangulation(points){
    let pointsIndexList = [];
    for (let i = 0; i < points.length; i++) {
        pointsIndexList.push(i);
    }
    let eboList = []
    while (!(pointsIndexList.length <= 3)){
        for (let i=0; i<pointsIndexList.length; i++){
            let vertexAIndex = pointsIndexList[i];
            let vertexBIndex = pointsIndexList[(i+1)%pointsIndexList.length];
            let vertexCIndex = pointsIndexList[(i-1+pointsIndexList.length)%pointsIndexList.length];
            if (isVerticesFormTriangle(vertexAIndex,vertexBIndex,vertexCIndex,points,pointsIndexList)){
                eboList.push(vertexAIndex, vertexBIndex,vertexCIndex);
                pointsIndexList.splice(i,1)
                break;
            }
        }
    }
    eboList.push(pointsIndexList[0],pointsIndexList[1],pointsIndexList[2]);
    return eboList;
}

function checkAndRemoveDuplicatePoints(points){
    for (let i = 0; i < points.length; i++) {
        for (let j = i+1; j < points.length; j++){
            if(points[i].inRangeOf(0.001,points[j])){
                points.splice(j,1);
            }
        }
    }
    return points;
}

function findCenterPoint(points){
    let center = new Point(0,0,0);
    for (let i = 0; i < points.length; i++){
        center = Point.addByPoint(center, points[i]);
    }
    center = Point.multiplyByScaler(center,1/points.length);
    return center;
}

class Point{
    x;
    y;
    z;

    constructor(x,y, z=0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }


    static multiplyByScaler(p, s){
        let p3 = new Point(0, 0, 0);
        p3.x = s*p.x;
        p3.y = s*p.y;
        p3.z = s*p.z;
        return p3;
    }

    static multiplyByPoint(p1,p2){
        let p3 = new Point(0, 0);
        p3.x = p2.x * p1.x;
        p3.y = p2.y * p1.y;
        p3.z = p2.z * p1.z;
        return p3;
    }

    static addByPoint(p1, p2){
        let p3 = new Point(0, 0);
        p3.x = p2.x + p1.x;
        p3.y = p2.y + p1.y;
        p3.z = p2.z + p1.z;
        return p3;
    }

    equals(otherPoint){
        return otherPoint.x === this.x && otherPoint.y === this.y && otherPoint.z === this.z;
    }

    static subtractByPoint(p1, p2){
        let p3 = new Point(0, 0);
        p3.x = p1.x - p2.x;
        p3.y = p1.y - p2.y;
        p3.z = p1.z - p2.z;
        return p3;
    }

    static dotProduct(p1, p2){
        let returnNumber = 0;
        returnNumber = p1.x*p2.x + p1.y*p2.y + p1.z*p2.z;
        return returnNumber;
    }

    static crossProduct2D(p1, p2){
        return p1.x*p2.y - p1.y*p2.x;
    }

    inRangeOf(range, point){
        let p = Point.subtractByPoint(this,point);

        return p.length() < range;
    }

    length(){
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    static addByScaler(p,s){
        let p3 = new Point(0, 0);
        p3.x = s+p.x;
        p3.y = s+p.y;
        return p3;
    }
}