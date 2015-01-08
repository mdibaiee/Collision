var $canvas = document.getElementById('c'),
    c = $canvas.getContext('2d');

var abs = Math.abs,
    pow = Math.pow;

$canvas.width = window.innerWidth;
$canvas.height = window.innerHeight;

/*-------------*/
/*-- Classes --*/
/*-------------*/

var circles = [];

// props = {x, y, radius}
var Circle = function(props) {
  extend(this, {speed: [3, 3]}, props);

  circles.push(this);
}

Circle.prototype = {
  get left() {
    return this.x - this.radius;
  },
  get top() {
    return this.y - this.radius;
  },
  get right() {
    return this.x + this.radius;
  },
  get bottom() {
    return this.y + this.radius;
  },
  move: function() {
    if(this.stop) return;
    this.x += this.speed[0];
    this.y += this.speed[1];
  },
  draw: function() {
    c.beginPath();
    c.fillStyle = this.collides ? '#F14B4B' : '#4F4F4F';
    c.arc(this.x, this.y, this.radius, 0, 2*Math.PI);
    c.fill();
    c.stroke();
  }
}

var planes = [];

// props = {x, y, width, height}
var Plane = function(props) {
  extend(this, {speed: [3, 3]}, props);

  planes.push(this);
}

Plane.prototype = {
  get left() {
    return this.x;
  },
  get right() {
    return this.x + this.width;
  },
  get top() {
    return this.y;
  },
  get bottom() {
    return this.y + this.height;
  },
  get centerX() {
    return this.x + this.width/2;
  },
  get centerY() {
    return this.y + this.height/2;
  },
  move: function() {
    if(this.stop) return;
    this.x += this.speed[0];
    this.y += this.speed[1];
  },
  draw: function() {
    c.beginPath();
    c.fillStyle = this.collides ? '#F14B4B' : '#4F4F4F';
    c.rect(this.x, this.y, this.width, this.height);
    c.fill();
    c.stroke();
  }
}

// props = {x, y}
var Vector = function(props) {
  extend(this, props);
}

Vector.prototype = {
  get length() {
    return Math.sqrt(this.x*this.x + this.y*this.y);
  },
  // Used for faster calculations in case of comparisons
  get squareLength() {
    return this.x*this.x + this.y*this.y
  }
}

Vector.random = function(n) {
  var r1 = Math.random(),
      r2 = Math.random();

  n = n || 1;

  return [(r1 === 0 ? 0 : r1 > 0.5 ? 1 : -1)*n, (r2 === 0 ? 0 : r2 > 0.5 ? 1 : -1)*n]
}

/*---------------*/
/*-- Functions --*/
/*---------------*/

function circleCollision(c1, c2) {
  // Multiplication is cheaper than taking roots
  return pow(c1.radius + c2.radius, 2) > pow(c1.x-c2.x, 2) + pow(c1.y-c2.y, 2);
}

function planeCollision(p1, p2) {
  var xCollision = p1.width/2 + p2.width/2 > abs(p1.x - p2.x);
  var yCollision = p1.height/2 + p2.height/2 > abs(p1.y - p2.y);

  return xCollision && yCollision;
}

function circleVSplaneCollision(c, p) {
  var vec = new Vector({x: c.x - p.centerX, y: c.y - p.centerY});
  vec.x += vec.x < 0 ? p.width/2 : -p.width/2;
  vec.y += vec.y < 0 ? p.height/2 : -p.height/2;
  return vec.squareLength - c.radius*c.radius <= 0
}

function edgeCollision(obj) {
  if(obj.left < 0 || obj.right > $canvas.width) obj.speed[0] *= -1;
  if(obj.top < 0 || obj.bottom > $canvas.height) obj.speed[1] *= -1;
}

/*--------------*/
/*---- Loop ----*/
/*--------------*/

var reqAnimFrame = requestAnimationFrame ||
                   mozRequestAnimationFrame ||
                   oRequestAnimationFrame ||
                   msRequestAnimationFrame ||
                   webkitRequestAnimationFrame;



for(var i = 0; i < 10; i++) {
  new Circle({
    x: Math.round(Math.random()*$canvas.width),
    y: Math.round(Math.random()*$canvas.height),
    radius: Math.round(Math.random()*20+8),
    speed: Vector.random(3)
  })

  new Plane({
    x: Math.round(Math.random()*$canvas.width),
    y: Math.round(Math.random()*$canvas.height),
    width: Math.round(Math.random()*30)+10,
    height: Math.round(Math.random()*30)+10,
    speed: Vector.random(3)
  })
}

c.strokeStyle = '#484848';
c.fillStyle = '#4F4F4F';

(function loop() {
  reqAnimFrame(function() {
    c.clearRect(0, 0, $canvas.width, $canvas.height);

    for(var i = 0, len = circles.length; i < len; i++) {
      var circle = circles[i];

      for(var x = 0; x < len; x++) {
        if(x == i) continue;
        if(circleCollision(circle, circles[x])) {
          circles[x].collides = true;
          circle.collides = true;
        }
      }

      for(var x = 0, l = planes.length; x < l; x++) {
        if(circleVSplaneCollision(circle, planes[x])) {
          planes[x].collides = true;
          circle.collides = true;
        }
      }


      if(!circle.collides) circle.move();
      circle.draw();
      edgeCollision(circle);
    }

    for(var i = 0, len = planes.length; i < len; i++) {
      var plane = planes[i];

      var r = false;

      for(var x = 0; x < len; x++) {
        if(x === i) continue;
        if(planeCollision(plane, planes[x])) {
          plane.collides = true;
          planes[x].collides = true;
        }
      }
      for(var x = 0, l = circles.length; x < l; x++) {
        if(circleVSplaneCollision(circles[x], plane)) {
          plane.collides = true;
          circles[x].collides = true;
        }
      }

      if(!plane.collides) plane.move();
      plane.draw();
      edgeCollision(plane); 
    }

    loop();
  });
})();

var mouseTarget = null;

$canvas.addEventListener('mousedown', function(e) {
  var objects = circles.concat(planes);
  for(var i = 0, len = objects.length; i < len; i++) {
    var obj = objects[i];
    if(obj.left < e.pageX && obj.right > e.pageX && obj.top < e.pageY && obj.bottom > e.pageY)
      mouseTarget = obj;
  }

  mouseTarget.stop = true;
})

$canvas.addEventListener('mousemove', function(e) {
  if(mouseTarget) {
    mouseTarget.x = e.pageX;
    mouseTarget.y = e.pageY;
    mouseTarget.collides = false;
  }
})

$canvas.addEventListener('mouseup', function() {
  mouseTarget.stop = false;
  mouseTarget = null;
})