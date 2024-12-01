const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const exceptionWindow = document.getElementById('exceptionWindow');
const heading = document.getElementById('heading');

let jsonData = null;

function onResize() {
    if (jsonData) {
        const svg = document.querySelector("svg");
        svg.innerHTML = "";
        drawTree(jsonData);
    }
}

window.addEventListener("resize", onResize);

// Function to handle reading the file
function handleFile(file) {
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                jsonData = JSON.parse(e.target.result);
                document.getElementById('jsonContentContainer').classList.add("jsonContentContainerShow")
                document.getElementById('jsonContent').textContent = JSON.stringify(jsonData, null, 4);
                const svg = document.querySelector("svg");
                svg.innerHTML = "";
                svg.classList.add("svgTree");
                drawTree(jsonData);
                exceptionWindow.textContent = "";
            } catch (error) {
                exceptionWindow.textContent = "Error parsing JSON";
            }
        };
        reader.readAsText(file);
    } else {
        exceptionWindow.textContent = "Please select a valid JSON file";
    }
}

// Event listener for file input (manual selection)
fileInput.addEventListener('change', function (event) {
    const file = event.target.files[0];
    heading.textContent = file.name;
    handleFile(file);
});

// Drag and drop functionality
dropZone.addEventListener('dragover', function (event) {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function (event) {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function (event) {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    heading.textContent = file.name;
    handleFile(file);
});

function convertBinaryToD3Tree(jsonNode) {
    const node = { value: jsonNode.value };
    node.children = [];
    if (jsonNode.left) node.children.push(convertBinaryToD3Tree(jsonNode.left));
    if (jsonNode.right) node.children.push(convertBinaryToD3Tree(jsonNode.right));
    return node;
}


function convertNaryTreeToD3Tree(jsonNode) {
    const node = { value: jsonNode.value };
    if (jsonNode.children && Array.isArray(jsonNode.children)) {
        node.children = jsonNode.children.map(convertNaryTreeToD3Tree);
    }
    return node;
}

function isNaryTree(node) {
    if (node.children) {
        return true;
    }
    return false;
}

function isBinaryTree(node) {
    if (node.left) {
        return true;
    }

    if (node.right) {
        return true;
    }

    return false;
}

function drawTree(jsonData) {
    const svg = d3.select("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    // Calculate the dimensions based on the data
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    // const width = window.innerWidth - margin.left - margin.right; // 100% width
    const width = window.innerWidth - margin.left - margin.right;

    let convertedNode = null;
    if (isBinaryTree(jsonData)) {
        console.log("Binary tree");
        convertedNode = convertBinaryToD3Tree(jsonData);
    } else if (isNaryTree(jsonData)) {
        console.log("N-ary tree");
        convertedNode = convertNaryTreeToD3Tree(jsonData);
    } else {
        console.log("Falling back to default: binary tree");
        convertedNode = convertBinaryToD3Tree(jsonData);
    }

    // Convert the JSON data to a D3 hierarchy
    const root = d3.hierarchy(convertedNode, d => d.children);

    // Automatically adjust the height based on the tree's depth
    const nodeHeight = 100; // Space between nodes vertically
    const height = root.height * nodeHeight + margin.top + margin.bottom;
    svg.attr("height", height);

    // Create a group element to apply margin transformations
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up the tree layout with the dynamic width and height
    const treeLayout = d3.tree().size([width, height - margin.top - margin.bottom]);

    treeLayout.separation((a, b) => {
        return 1; // More separation for siblings
    });

    // Apply the tree layout to the root
    treeLayout(root);

    // Draw the links (edges)
    let link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
            .target(d => ({ x: d.target.x, y: d.target.y })));

    // Draw the nodes
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on("start", function (event, d) {
                d3.select(this).raise().attr("stroke", "black");
            })
            .on("drag", function (event, d) {
                // Update node position
                d.x = event.x;
                d.y = event.y;
                d3.select(this).attr("transform", `translate(${d.x},${d.y})`);

                // Update the links dynamically during the drag
                link.attr("d", function (linkData) {
                    return d3.linkVertical()
                        .x(d => d.x)
                        .y(d => d.y)({
                            source: { x: linkData.source.x, y: linkData.source.y },
                            target: { x: linkData.target.x, y: linkData.target.y }
                        });
                });
            })
            .on("end", function (event, d) {
                d3.select(this).attr("stroke", null);
            }));

    // Append ellipses for each node
    node.append("ellipse")
        .attr("rx", 20) // Default horizontal radius
        .attr("ry", 20) // Fixed vertical radius
        .attr("fill", "white") // Set fill color
        .attr("stroke", "steelblue") // Set border color
        .attr("stroke-width", 3); // Set border thickness

    // Append text for each node, centered in the circle
    node.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text(d => d.data.value);

    node.each(function (d) {
        const text = d.data.value;
        const textLength = text.length;

        // Dynamically adjust ellipse width
        const rx = Math.max(20, textLength * 4); // Adjust horizontal radius based on text length
        d3.select(this).select("ellipse").attr("rx", rx); // Set the dynamic width

        // Dynamically adjust font size
        const fontSize = Math.max(6, 16 - textLength / 2) + "px";
        d3.select(this).select("text")
            .style("font-size", fontSize)
            .text(text);
    });

}



