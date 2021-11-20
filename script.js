'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
let inputDistance = document.querySelector('.form__input--distance');
let inputDuration = document.querySelector('.form__input--duration');
let inputCadence = document.querySelector('.form__input--cadence');
let inputElevation = document.querySelector('.form__input--elevation');
class WorkOut {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, duration, distance,) {
        this.coords = coords; // [lat , lng]
        this.duration = duration;// in min
        this.distance = distance; // in km
    }
    _markerDiscription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.discription = `
        ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}
        `
    }

}
class Running extends WorkOut {
    type = 'running';
    constructor(coords, duration, distance, cadence) {
        super(coords, duration, distance);
        this.cadence = cadence;
        this.calcPace();
        this._markerDiscription()
    }
    calcPace() {
        // min / km
        this.pace = this.duration / this.distance;
    }
}

class Cycling extends WorkOut {
    type = 'cycling';
    constructor(coords, duration, distance, elevation) {
        super(coords, duration, distance);
        this.elevation = elevation;
        this.calcSpeed();
        this._markerDiscription()
    }
    calcSpeed() {
        // km / h
        this.speed = this.distance / (this.duration / 60)
    }
}
//////////////////////////////////////////////////////////////////////
////////// application ARCHITECTURE

class App {
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoom = 13;
    constructor() {
        // GET Position form Navigator/User
        this._getPosition();
        // Submit new  Workout 
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        // Move workout 
        containerWorkouts.addEventListener('click', this._moveWorkout.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('could not get your position')
            })
        };
    }
    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude]
        this.#map = L.map('map').setView(coords, this.#mapZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on('click', this._showForm.bind(this));
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForm() {
        // clear input fields + hide form
        inputDistance.value = inputCadence.value = inputElevation.value = inputDuration.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);
    }
    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        //if workout running , create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //  check if data is valid
            if (
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Input have to be Positive 😂')

            workout = new Running([lat, lng], distance, duration, cadence);
        }
        //if workout cycling , create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            )
                return alert('Input have to be Positive 😂');
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }
        // add new object to workout array
        this.#workouts.push(workout);
        //rander workout on list
        this._randerWorkoutList(workout);
        //render workout on map as marker
        this._randerWorkoutMarker(workout);
        // hide form
        this._hideForm();

    }
    _randerWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 200,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })).setPopupContent(`${workout.discription}`).openPopup();
    }
    _randerWorkoutList(workout) {
        let html = `
        <li class="workout workout--running" data-id="${workout.id}">
        <h2 class="workout__title">Running on April 14</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div> `;
        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }
        if (workout.type === 'cycling') {
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
              </div>
              <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevation}</span>
                <span class="workout__unit">m</span>
              </div>
            </li>`;
        }
        form.insertAdjacentHTML('afterend', html);
    }
    _moveWorkout(e) {
        const workEl = e.target.closest('.workout');

        if (!workEl) return;

        const work = this.#workouts.find(
            workout => workout.id === workEl.dataset.id
        );

        this.#map.setView(work.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duration: 1,
            }
        })
    }
}
const app = new App();



