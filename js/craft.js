const carousel = document.querySelector('.carousel');
const arrowBtns = document.querySelectorAll('.icons');
const dropZones = document.querySelectorAll('.drop-zone');
const suggestionsDiv = document.getElementById('craft-suggestions');
const suggestionsList = document.getElementById('suggestions-list');
const suggestionsArrowBtns = document.querySelectorAll('#suggestions-left, #suggestions-right');
const modal = document.getElementById('craft-modal');
const closeModalBtn = document.getElementById('close-modal');

let selectedMaterials = [];
let draggedElement = null;


// will be filled from fetch
let data = {};

// Fetch data from json file
fetch('../data/data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(json => {
    data = json;
    // run if data already
    populateCarousel(); 
  })
  .catch(error => console.error('Error loading JSON:', error));

// Populate carousel with materials
function populateCarousel() {
  if (!data.materials) {
    console.error('Data materials not loaded yet');
    return;
  }
  data.materials.forEach(material => {
    const li = document.createElement('li');
    li.className = 'cards list-none select-none cursor-grab rounded-xl hover:scale-98 transition duration-300 px-2';
    li.innerHTML = `
      <span class="span-cards w-[300px] block p-4 bg-white rounded-xl shadow-xl">
        <img src="${material.image}" alt="${material.name}" class="w-full rounded-xl object-contain object-top aspect-video draggable" draggable="true" data-id="${material.id}">
        <p class="text-sm mx-auto font-semibold py-2 my-4 px-2 bg-green-600 text-white rounded-4xl w-fit opacity-90">${material.name}</p>
      </span>
    `;
    carousel.appendChild(li);

    // Input eventlistener dragstart to img after append
    const img = li.querySelector('.draggable');
    img.addEventListener('dragstart', (e) => {
      draggedElement = e.target;
      e.dataTransfer.setData('text/plain', e.target.dataset.id);
    });
  });

  // Initialize arrow visibility after populating
  updateArrowVisibility(carousel, arrowBtns);
}

// Carousel logic for main carousel
const firstCardWidth = carousel.querySelector('.cards')?.offsetWidth || 300; // Fallback jika belum ada

let isDragging = false,
    startX,
    startScrollLeft;

// Arrow buttons for main carousel
arrowBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    carousel.scrollLeft += btn.id === "left" ? -firstCardWidth : firstCardWidth;
    updateArrowVisibility(carousel, arrowBtns); // Update after click
  });
});

// Slider drag for main carousel
const dragStart = (e) => {
  if (e.target.classList.contains('draggable')) {
    return;
  }
  isDragging = true;
  carousel.classList.add("dragging");
  startX = e.pageX;
  startScrollLeft = carousel.scrollLeft;
};

const dragging = (e) => {
  if (!isDragging) return;
  carousel.scrollLeft = startScrollLeft - (e.pageX - startX);
};

const dragStop = () => {
  isDragging = false;
  carousel.classList.remove("dragging");
  updateArrowVisibility(carousel, arrowBtns); // Update after drag
};

carousel.addEventListener("mousedown", dragStart);
carousel.addEventListener("mousemove", dragging);
document.addEventListener("mouseup", dragStop);

// Add scroll event to update arrows
carousel.addEventListener('scroll', () => {
  updateArrowVisibility(carousel, arrowBtns);
});

// Function to update arrow visibility
function updateArrowVisibility(carouselElement, arrowButtons) {
  const scrollLeft = carouselElement.scrollLeft;
  const scrollWidth = carouselElement.scrollWidth;
  const clientWidth = carouselElement.clientWidth;

  const leftBtn = arrowButtons[0]; // first is left
  const rightBtn = arrowButtons[1]; //second is right

  // Hide left arrow if at start
  if (scrollLeft <= 0) {
    leftBtn.style.opacity = '0';
    leftBtn.style.pointerEvents = 'none';
  } else {
    leftBtn.style.opacity = '1';
    leftBtn.style.pointerEvents = 'auto';
  }

  // Hide right arrow if at end
  if (scrollLeft >= scrollWidth - clientWidth - 1) {
    rightBtn.style.opacity = '0';
    rightBtn.style.pointerEvents = 'none';
  } else {
    rightBtn.style.opacity = '1';
    rightBtn.style.pointerEvents = 'auto';
  }
}

// Drag and drop for materials
dropZones.forEach(zone => {
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const materialId = e.dataTransfer.getData('text/plain');
    if (materialId && !selectedMaterials.includes(materialId)) {
      selectedMaterials.push(materialId);
      const img = document.createElement('img');
      img.src = draggedElement.src;
      img.alt = draggedElement.alt;
      img.className = 'w-full object-contain object-top aspect-video';
      zone.innerHTML = '';
      zone.appendChild(img);
      // Nonactive drag picture when have dropped
      img.draggable = false;
      img.classList.remove('draggable'); 
      img.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
      updateSuggestions();
    }
  });
});


// Update suggestions
function updateSuggestions() {
  if (selectedMaterials.length >= 2) {
    const matchingCrafts = data.crafts.filter(craft => {
      return craft.required.every(req => selectedMaterials.includes(req));
    });
    displaySuggestions(matchingCrafts);
  } else {
    suggestionsDiv.classList.add('hidden');
  }
}

function displaySuggestions(crafts) {
  suggestionsList.innerHTML = '';
  crafts.forEach(craft => {
    const li = document.createElement('li');
    li.className = 'cards list-none select-none cursor-pointer rounded-xl hover:scale-98 transition duration-300 px-2';
    li.innerHTML = `
      <span class="span-cards w-[300px] block p-4 bg-white rounded-xl shadow-xl">
        <img src="${craft.image}" alt="${craft.name}" class="w-full rounded-xl object-cover aspect-video mb-2">
        <p class="text-sm mx-auto font-semibold py-2 my-4 px-2 bg-green-600 text-white rounded-4xl w-fit opacity-90">${craft.name}</p>
      </span>
    `;
    li.addEventListener('click', () => showCraftDetail(craft));
    suggestionsList.appendChild(li);
  });
  suggestionsDiv.classList.remove('hidden');
  // Initialize suggestions carousel after populating
  initSuggestionsCarousel();
}

// Initialize suggestions carousel
function initSuggestionsCarousel() {
  const suggestionsCarousel = suggestionsList;
  const suggestionsFirstCardWidth = suggestionsCarousel.querySelector('.cards')?.offsetWidth || 300; // Fallback width

  let suggestionsIsDragging = false,
      suggestionsStartX,
      suggestionsStartScrollLeft;

  // Arrow buttons for suggestions carousel
  suggestionsArrowBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      suggestionsCarousel.scrollLeft += btn.id === "suggestions-left" ? -suggestionsFirstCardWidth : suggestionsFirstCardWidth;
      updateArrowVisibility(suggestionsCarousel, suggestionsArrowBtns); // Update after click
    });
  });

  // Slider drag for suggestions carousel
  const suggestionsDragStart = (e) => {
    suggestionsIsDragging = true;
    suggestionsCarousel.classList.add("dragging");
    suggestionsStartX = e.pageX;
    suggestionsStartScrollLeft = suggestionsCarousel.scrollLeft;
  };

  const suggestionsDragging = (e) => {
    if (!suggestionsIsDragging) return;
    suggestionsCarousel.scrollLeft = suggestionsStartScrollLeft - (e.pageX - suggestionsStartX);
  };

  const suggestionsDragStop = () => {
    suggestionsIsDragging = false;
    suggestionsCarousel.classList.remove("dragging");
    updateArrowVisibility(suggestionsCarousel, suggestionsArrowBtns); // Update after drag
  };

  suggestionsCarousel.addEventListener("mousedown", suggestionsDragStart);
  suggestionsCarousel.addEventListener("mousemove", suggestionsDragging);
  document.addEventListener("mouseup", suggestionsDragStop);

  // Add scroll event for suggestions
  suggestionsCarousel.addEventListener('scroll', () => {
    updateArrowVisibility(suggestionsCarousel, suggestionsArrowBtns);
  });


  // Initial update
  updateArrowVisibility(suggestionsCarousel, suggestionsArrowBtns);
}

// Show craft detail
function showCraftDetail(craft) {
  const craftName = document.getElementById('craft-name');
  craftName.classList.add("text-sm", "mx-auto", "font-semibold", "py-2", "my-2", "px-2", "bg-green-600", "text-white", "rounded-2xl", "w-fit", "opacity-90", "shadow-lg");
  craftName.textContent = craft.name;

  const stepsList = document.getElementById('craft-steps');
  stepsList.classList.add("text-base", "font-semibold", "text-slate-800");
  stepsList.innerHTML = ``;
  craft.steps.forEach(step => {
    const li = document.createElement('li');
    li.textContent = step;
    stepsList.appendChild(li);
  });
  craftVideo = document.getElementById('craft-video');
  craftVideo.src = craft.video;
  craftVideo.classList.add("mx-auto", "py-2", "my-4", "px-2", "rounded-2xl", "w-[350px]", "md:w-[400px]");
  modal.classList.remove('hidden');
  modal.classList.add('flex')
}

// Close modal
closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  document.getElementById('craft-video').src = '';
});
