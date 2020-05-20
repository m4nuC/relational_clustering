import * as tf from "@tensorflow/tfjs-core";

import "./styles.css";
import { exp } from "@tensorflow/tfjs-core";

const canvas_size = 500;
const unit_size = 50;

// DOM elements
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const vector_data = document.getElementById("vector_data");
const vectors_list = document.getElementById("vectors_list");
const clear_btn = document.getElementById("clear_btn");
const add_btn = document.getElementById("add_btn");
const make_groups_btn = document.getElementById("make_groups_btn");

let data_points = [];
let range = n => Array.from(Array(n).keys());

const whipe_canvas = (canvas, size) => {
  canvas.width = size;
  canvas.height = size;
  ctx.beginPath();
  ctx.rect(0, 0, size, size);
  ctx.fillStyle = "white";
  ctx.fill();
  canvas.style.border = "1px solid black";
};

const set_event_listeners = canvas => {
  canvas.addEventListener("mouseup", event => {
    let X = event.clientX + unit_size;
    X = Math.floor(X / unit_size);

    let Y =
      canvas_size -
      event.clientY -
      document.body.scrollTop -
      document.documentElement.scrollTop +
      unit_size;
    Y = Math.floor(Y / unit_size);
    const new_point = [X, Y];
    data_points.push(new_point);
    append_vector_to_list(new_point);
    draw_vectors();
  });
};

const init_canvas = (canvas, canvas_size) => {
  whipe_canvas(canvas, canvas_size);
  set_event_listeners(canvas);
};

const draw_vector = (x, y, name, color = "black") => {
  ctx.beginPath();
  const scaled_x = x * unit_size;

  // Dont forget that origin is on the top left on a canvas
  const scaled_y = canvas_size - y * unit_size;

  // We remove one unit size from coordinate since the rectangle will occupy one unit
  ctx.rect(scaled_x - unit_size, scaled_y, unit_size, unit_size);
  ctx.fillStyle = color;
  ctx.fill();
  if (name) {
    ctx.font = "bold 13px Arial";
    const { width } = ctx.measureText(name); // TextMetrics object
    ctx.fillStyle = "white";
    ctx.fillText(
      name,
      scaled_x - unit_size + width / 2,
      scaled_y + unit_size - width / 2
    );
  }
};

const relational_model_between = (A, B) => {
  const tensor_A = tf.tensor(A);
  const tensor_B = tf.tensor(B);
  const distance = tensor_B.sub(tensor_A);
  return distance;
};

const data_point_exists = (A, target_array) => {
  // console.log("checking if exist:", A,  A.toString());
  // console.log(data_points.find(B => B.toString() === A.toString()));
  // return false;
  return data_points.find(B => B.toString() === A.toString());
};

function make_groups() {
  const groups = [];
  const explored = new Set();
  for (let i = 0; i < data_points.length; i++) {
    const A = data_points[i];
    console.log("A", A);
    if (!A || explored.has(A.join("_"))) {
      continue;
    }
    if (i === data_points.length - 1) {
      groups.push([[0, 0], A, 1]);
      explored.add(A.join("_"));
      continue;
    }

    const group_candidates = {};
    for (let j = i + 1; j <= data_points.length; j++) {
      const B = data_points[j];
      console.log("B", B, B && explored.has(B.join("_")));
      if (!B || A.toString() === B.toString() || explored.has(B.join("_"))) {
        continue;
      }
      let next_component = B;
      let relation_model = relational_model_between(A, B);
      let id = `${A.join("_")}_${relation_model.arraySync().join("_")}`;
      let max_loop = 200;
      let start_component = next_component;
      let component_count = 1;
      while (next_component && max_loop > 0) {
        max_loop--;
        component_count++;
        const tensor_B = tf.tensor(next_component);
        const C = tensor_B.add(relation_model).arraySync();
        start_component = next_component;
        next_component = data_point_exists(C, data_points);
      }

      console.log("reached end of model at", start_component);
      group_candidates[id] = [
        [relation_model.arraySync(), next_component, component_count]
      ];
      next_component = start_component;
      while (next_component && max_loop > 0) {
        max_loop--;
        console.log(next_component);
        const tensor_B = tf.tensor(next_component);
        const C = tensor_B.sub(relation_model).arraySync();
        next_component = data_point_exists(C, data_points);
        if (explored.has(C.join("_"))) {
          next_component = null;
        }
        if (next_component) {
          console.log(`Adding to candidates ${id}`);
          group_candidates[id] = [
            relation_model.arraySync(),
            next_component,
            component_count
          ];
        }
      }
    }
    console.log(group_candidates);
    const largest_group = Object.values(group_candidates).reduce(
      (acc, group) => {
        if (acc[2] < group[2]) {
          return group;
        }
        return acc;
      }
    );
    console.log("largest_group", largest_group);

    groups.push(largest_group);
    console.log(largest_group);
    const units = range(largest_group[2]).map((_, i) => {
      console.log(i);
      return [
        largest_group[1][0] + largest_group[0][0] * i,
        largest_group[1][1] + largest_group[0][1] * i
      ];
    }); // Index 2 is the length of the group
    console.log("units", units);
    units.forEach(point => {
      explored.add(point.join("_"));
    });
  }

  console.log(groups);
}

function draw_vectors() {
  whipe_canvas(canvas, canvas_size);
  data_points.forEach(point => {
    draw_vector(...point);
  });
}

init_canvas(canvas, canvas_size);

// UI
clear_btn.addEventListener("click", e => {
  data_points = [];
  vectors_list.innerHTML = "";
  draw_vectors();
});
add_btn.addEventListener("click", e => {
  const [x, y] = vector_data.value.split(",").map(str => parseInt(str, 10));
  data_points.push([x, y]);
  append_vector_to_list([x, y]);
  draw_vectors();
});

make_groups_btn.addEventListener("click", e => {
  make_groups();
});
function append_vector_to_list(vector) {
  const li = document.createElement("li");
  li.textContent = " (" + vector.join(",") + ") | ";
  vectors_list.appendChild(li);
}
