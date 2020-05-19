import * as tf from "@tensorflow/tfjs-core";

import "./styles.css";

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

const groups = [];
const explored = new Set();
function make_groups() {
  for (let i = 0; i < data_points.length; i++) {
    const A = data_points[i];
    if (!A || explored.has(A)) {
      continue;
    }

    const group_candidates = {};
    for (let j = i + 1; j < data_points.length; j++) {
      const B = data_points[j];
      if (!B || explored.has(B) || A.toString() === B.toString()) {
        groups.push(A);
        explored.add(A);
        console.log("lonely point");
        continue;
      }
      let next_component = B;
      const relation_model = relational_model_between(A, B);
      const id = `${A.join("_")}_${relation_model.arraySync().join("_")}`;
      if (!group_candidates[id]) {
        group_candidates[id] = [A, B];
      }
      let max_loop = 100;
      while (next_component && max_loop > 0) {
        max_loop--;
        const tensor_B = tf.tensor(next_component);

        const C = tensor_B.add(relation_model).arraySync();
        next_component = data_point_exists(C, data_points);
        if (next_component) {
          group_candidates[id] = [...group_candidates[id], next_component];
        }
      }
    }
    const largest_group = Object.values(group_candidates).reduce(
      (acc, group) => {
        if (acc.length < group.length) {
          return group;
        }
        return acc;
      },
      []
    );
    if (largest_group.length > 0) {
      groups.push(largest_group);
    }
    largest_group.forEach(point => {
      explored.add(point);
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
