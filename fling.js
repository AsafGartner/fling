var Canvas = document.getElementById("canvas");
var CW = 500;
var CH = 500;

var Ctx = canvas.getContext("2d");

Ctx.fillStyle = "black";
Ctx.strokeStyle = "white";

Ctx.fillRect(0, 0, CW, CH);

function FlingVel(Velocity, Deceleration) {
  return function(TimeInSeconds) {
    return Velocity - Deceleration*TimeInSeconds*TimeInSeconds;
  };
}

function FlingPos(Velocity, Deceleration) {
  return function(TimeInSeconds) {
    return GetFlingPositionInTime(Velocity, Deceleration, TimeInSeconds);
  };
}

function FlingPosition(Velocity, Deceleration) {
  return function(Time) {
    return 2*Deceleration*Time;
  };
}

function GetFlingDuration(Velocity, Deceleration) {
  return Math.sqrt(Velocity/Deceleration);
}

function GetFlingPositionInTime(Velocity, Deceleration, Time) {
  return Velocity*Time - (Deceleration*Time*Time*Time)/3;
}

function GetFlingFinalPosition(Velocity, Deceleration) {
  var Duration = GetFlingDuration(Velocity, Deceleration);
  return GetFlingPositionInTime(Velocity, Deceleration, Duration);
}

function GetFlingVelocityForTarget(Deceleration, Target) {
  var Duration = Math.cbrt((Target/Deceleration)*3/2);
  return Deceleration*Duration*Duration;
}

function Lerp(T, Start, End) {
  return (1-T)*Start + T*End;
}

function Map(Val, OriginStart, OriginEnd, TargetStart, TargetEnd) {
  var T = (Val-OriginStart)/(OriginEnd-OriginStart);
  return Lerp(T, TargetStart, TargetEnd);
}

function DrawFn(Fn, StartX, EndX, StartY, EndY) {
  Ctx.fillRect(0, 0, CW, CH);
  Ctx.strokeStyle = "grey";
  var XAxisPos = Map(0, StartX, EndX, 0, CW);
  XAxisPos = Math.max(0, Math.min(XAxisPos, CW-1));
  Ctx.beginPath();
  Ctx.moveTo(XAxisPos, 0);
  Ctx.lineTo(XAxisPos, CH);
  Ctx.stroke();

  var YAxisPos = Map(0, StartY, EndY, CH, 0);
  YAxisPos = Math.max(0, Math.min(YAxisPos, CH-1));
  Ctx.beginPath();
  Ctx.moveTo(0, YAxisPos);
  Ctx.lineTo(CW, YAxisPos);
  Ctx.stroke();

  Ctx.strokeStyle = "cyan";
  Ctx.strokeText(StartX, 0, YAxisPos);
  Ctx.strokeText(EndX, CW-Ctx.measureText(EndX).width, YAxisPos);

  Ctx.strokeStyle = "white";
  Ctx.beginPath();
  Ctx.moveTo(0, Map(Fn(Map(0, 0, CW, StartX, EndX)), StartY, EndY, CH, 0));
  for (var I = 0; I < CW; ++I) {
    Ctx.lineTo(I, Map(Fn(Map(I, 0, CW, StartX, EndX)), StartY, EndY, CH, 0));
  }
  Ctx.stroke();
}

var Velocity = 100;
var Deceleration = 3000;

DrawFn(FlingVel(Velocity, Deceleration), 0, GetFlingDuration(Velocity, Deceleration), -2, Velocity+5);
console.log(GetFlingFinalPosition(Velocity, Deceleration));
console.log(GetFlingVelocityForTarget(Deceleration, GetFlingFinalPosition(Velocity, Deceleration)));
console.log(GetFlingFinalPosition(GetFlingVelocityForTarget(Deceleration, GetFlingFinalPosition(Velocity, Deceleration)), Deceleration));

var Items = document.querySelectorAll("li");
var ContainerWidth = 700;
var ItemWidth = 300;
var ItemMargin = 5;
var TotalItemWidth = ItemMargin + ItemWidth + ItemMargin;

function LayoutItems(ScrollPosition) {
  for (var I = 0; I < Items.length; ++I) {
    Items[I].style["left"] = -ScrollPosition + ItemMargin + (ItemMargin + ItemWidth + ItemMargin)*I;
  }
}

function GetCenterScrollPos(ItemIdx) {
  ItemIdx = Math.max(0, Math.min(ItemIdx, Items.length-1));
  return TotalItemWidth*ItemIdx - ContainerWidth/2 + TotalItemWidth/2;
}

function GetClosestCardIdx(Position) {
  if (Position < 0) {
    return 0;
  }
  return Math.min(Math.floor(Position / TotalItemWidth), Items.length-1);
}

LayoutItems(GetCenterScrollPos(0));

var Container = document.querySelector("ul");
var CurrentScroll = GetCenterScrollPos(0);
var Body = document.body;
var Down = false;
var LastTime = 0;
var LastPos = null;
var DownScroll = 0;
var Animating = false;
var Direction = 0;
var AnimationStartTime = 0;
var AnimationStartScroll = 0;

function GetTime() {
  return window.performance.now()/1000;
}

function Sign(X) {
  return (X > 0 ? 1 : (X < 0 ? -1 : 0));
}

Container.addEventListener("mousedown", function(Ev) {
  Down = true;
  LastPos = Ev.clientX;
  DownScroll = CurrentScroll;
  LastTime = GetTime();
  Animating = false;
  Velocity = 0;
  Direction = 0;
});

Body.addEventListener("mouseup", function() {
  Down = false;
  LastPos = null;
  if (Velocity > 0 && GetTime() - LastTime < 0.1) {
    console.log("Fling");
    Animating = true;
    var Idx = GetClosestCardIdx(CurrentScroll - Direction*GetFlingFinalPosition(Velocity, Deceleration));
    if (GetCenterScrollPos(Idx) > CurrentScroll) {
      Direction = -1;
    } else {
      Direction = 1;
    }
    Velocity = GetFlingVelocityForTarget(Deceleration, Math.abs(GetCenterScrollPos(Idx) - CurrentScroll));
    if (Math.abs(CurrentScroll - Direction*GetFlingFinalPosition(Velocity, Deceleration) - GetCenterScrollPos(Idx)) > 1) {
      debugger;
    }
    DrawFn(FlingVel(Velocity, Deceleration), 0, GetFlingDuration(Velocity, Deceleration), -2, Velocity+5);
    AnimationStartTime = GetTime();
    AnimationStartScroll = CurrentScroll;
    DoFrame();
  } else {
    console.log("Snap");
    Animating = true;
    var Idx = GetClosestCardIdx(CurrentScroll + ContainerWidth/2);
    var CardScrollPos = GetCenterScrollPos(Idx);
    Velocity = GetFlingVelocityForTarget(Deceleration, Math.abs(CardScrollPos - CurrentScroll));
    Direction = Sign(CurrentScroll - CardScrollPos);
    console.log(CurrentScroll - Direction*GetFlingFinalPosition(Velocity, Deceleration));
    console.log(CardScrollPos);
    AnimationStartTime = GetTime();
    AnimationStartScroll = CurrentScroll;
    DoFrame();
  }
});

Body.addEventListener("mousemove", function(Ev) {
  if (Down) {
    var Pos = Ev.clientX;
    var Diff = Pos - LastPos;
    var Time = GetTime();
    Velocity = Math.abs(Diff / (Time-LastTime));
    Direction = Sign(Diff);
    LastTime = Time;
    LastPos = Pos;
    CurrentScroll -= Diff;
    LayoutItems(CurrentScroll);
  }
});

function DoFrame() {
  if (Animating) {
    var Duration = GetFlingDuration(Velocity, Deceleration);
    var TimeInAnimation = Math.min(GetTime() - AnimationStartTime, Duration);
    CurrentScroll = AnimationStartScroll - Direction * GetFlingPositionInTime(Velocity, Deceleration, TimeInAnimation);
    LayoutItems(CurrentScroll);

    if (TimeInAnimation == Duration) {
      Animating = false;
    } else {
      requestAnimationFrame(DoFrame);
    }
  }
}
