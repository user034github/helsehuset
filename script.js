let language = document.documentElement.lang;
let user_action;
let user_action_stable;
let select;
let skjemaType;
let category;
let week_nr = get_week_nr();
let day_nr = (new Date().getDay() + 6) % 7;
let ref_day_nr = (new Date().getDay() + 6) % 7;
let time_nr;
let name;
let phone;
let description;
let countdown = 5;

(function () {
    var d = document;
    
    const container = d.querySelector(".weekDayPanel");
    const template = d.querySelector("#weekDayPanel-template");
    const id_list = ["0", "1", "2", "3", "4", "5", "6"];

    id_list.forEach(id => {
        const clone = template.content.cloneNode(true);

        clone.firstElementChild.id = id;
        container.appendChild(clone);
    });
    
    d.documentElement.classList.add('js');
    var wrap = d.querySelector(".week-days");
    
    if (wrap) {
        var weekDayList = wrap.querySelector(".week-day-list");
        var weekDay = [].slice.call(weekDayList.querySelectorAll(".week-btn"));
        var weekDayPanels = weekDay.map(function (day) {
            return d.getElementById(day.getAttribute('data-num'));
        });
        
        weekDayList.hidden = false;
        
        select = function (a, focus) {
            weekDay.forEach(function (day, b) {
                var on = a === b;
                day.setAttribute('data-selected', on);
                weekDayPanels[b].hidden = !on;
                
                if (on) {
                    weekDayPanels[b].classList.remove('access');
                    void weekDayPanels[b].offsetWidth;
                    weekDayPanels[b].classList.add('access');
                }
            });
            
            if (focus) {
                weekDay[a].focus();
            }
            day_nr = a;
        };
        
        weekDay.forEach(function (day, a) {
            day.addEventListener('click', function () {
                if (a >= ref_day_nr || week_nr > get_week_nr()) {
                    select(a);
                }
            });
            
            document.addEventListener("weekChanged", function() {
                select(ref_day_nr);
            })
        });
        select(day_nr);
    }
})();

if (window.location.pathname === "/helsehuset/") {
    document.getElementById("start").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};

set_week_display(week_nr);

function get_week_nr(date = new Date()) {
    const d = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    ));

    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const year_s = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

    return Math.ceil(((d - year_s) / 86400000 + 1) / 7);
}

function selectTjeneste(button) {
    if (skjemaType === "kontakt") {
        countdown_reset();
    }

    category = button.parentElement.querySelector("h3").textContent;
    const selectedTjeneste = document.querySelector(".ts-valgt");

    if (selectedTjeneste !== null) {
        selectedTjeneste.classList.remove("ts-valgt");
    }

    const selectedButton = document.querySelector(".velg-btn-valgt");

    if (selectedButton !== null) {
        selectedButton.className = "btn velg-btn";
    }

    button.closest(".ts").classList.add("ts-valgt");
    button.className = "btn velg-btn-valgt";

    document.querySelector("#no-category").hidden = true;
    document.querySelector("#category").hidden = false;

    if (language === "no") {
        document.querySelector("#category").textContent = `— du har valgt ${category}`;
    } else if (language === "en") {
        document.querySelector("#category").textContent = `— you have selected ${category}`;
    }
}

async function send(button) {
    name = document.getElementById("name");
    phone = document.getElementById("phone");
    description = document.getElementById("description");

    if ((name.value.trim().split(/\s+/)).length < 2) {
        if (language === "no") {
            alert("Vennligst skriv inn både for- og etternavn");
        } else if (language === "en") {
            alert("Please include both the first and last name");
        }
    } else if (phone.value.length > 7 && phone.value.length < 15) {
        if (countdown === 5) {
            if (skjemaType === "kontakt") {
                time_nr = String(new Date().getHours()).padStart(2, "0") + ":"
                    + String(new Date().getMinutes()).padStart(2, "0");
                if (language === "no") {
                    day_nr = day_index_no[day_nr];
                } else if (language === "en") {
                    day_nr = day_index_en[day_nr];
                }
                category = "Ingen";
            }
            try {
                const response = await fetch(skjema_index[skjemaType], {
                    method: "POST",
                    credentials: "same-origin",
                    body: JSON.stringify({
                        "week": week_nr,
                        "time": time_nr,
                        "day": day_nr,
                        "name": name.value,
                        "phone": String(phone.value),
                        "category": category,
                        "description": description.value
                    })
                });
                if (response.status === 200) {
                    let success_count = setInterval(() => {
                        if (skjemaType === "booking") {
                            if (language === "no") {
                                button.textContent = `Du har booket time (${countdown})`;
                            } else if (language === "en") {
                                button.textContent = `Booking is complete (${countdown})`;
                            }
                        } else if (skjemaType === "kontakt") {
                            if (language === "no") {
                                button.textContent = `Melding sendt (${countdown})`;
                            } else if (language === "en") {
                                button.textContent = `Message sent (${countdown})`;
                            }
                        }
                        countdown--;
                        if (countdown === -1) {
                            clearInterval(success_count);
                            if (language === "no") {
                                button.textContent = "Send inn";
                            } else if (language === "en") {
                                button.textContent = "Send in";
                            }
                            countdown_reset();
                        }
                    }, 1000);
                } else {
                    let error_count = setInterval(() => {
                        if (skjemaType === "booking") {
                            if (language === "no") {
                                button.textContent = `Noe gikk galt — vennligst ta kontakt (${countdown})`;
                            } else if (language === "en") {
                                button.textContent = `Something went wrong — contact us (${countdown})`;
                            }
                        } else if (skjemaType === "kontakt") {
                            if (language === "no") {
                                button.textContent = `Noe gikk galt — melding ikke sendt (${countdown})`;
                            } else if (language === "en") {
                                button.textContent = `Something went wrong — message not sent (${countdown})`;
                            }
                        }
                        countdown--;
                        if (countdown === -1) {
                            clearInterval(error_count);
                            if (language === "no") {
                                button.textContent = "Send inn";
                            } else if (language === "en") {
                                button.textContent = "Send in";
                            }
                            countdown_reset();
                        }
                    }, 1000);
                }
            } catch {
                let error_count = setInterval(() => {
                    if (skjemaType === "booking") {
                        if (language === "no") {
                            button.textContent = `Noe gikk galt — vennligst ta kontakt (${countdown})`;
                        } else if (language === "en") {
                            button.textContent = `Something went wrong — contact us (${countdown})`;
                        }
                    } else if (skjemaType === "kontakt") {
                        if (language === "no") {
                            button.textContent = `Noe gikk galt — melding ikke sendt (${countdown})`;
                        } else if (language === "en") {
                            button.textContent = `Something went wrong — message not sent (${countdown})`;
                        }
                    }
                    countdown--;
                    if (countdown === -1) {
                        clearInterval(error_count);
                        if (language === "no") {
                            button.textContent = "Send inn";
                        } else if (language === "en") {
                            button.textContent = "Send in";
                        }
                        countdown_reset();
                    }
                }, 1000);
            }
        }
    } else {
        if (language === "no") {
            alert("Vennligst skriv inn et gyldig telefonnummer");
        } else if (language === "en") {
            alert("Please include a valid phone number");
        }
    }
}

function countdown_reset() {
    document.getElementById("start").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    countdown = 5;
    category = undefined;
    select((new Date().getDay() + 6) % 7);

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("description").value = "";
    document.querySelector(".registrering").hidden = true;
    document.querySelector('[class="wrap"]').hidden = false;

    if (skjemaType !== "kontakt") {
        document.querySelector(".ts-valgt").classList.remove("ts-valgt");
        document.querySelector(".velg-btn-valgt").clsasName = "velg-btn";
        document.querySelector("#category").hidden = true;
    }
}

function selectTime(button) {
    skjemaType = "booking";
    time_content = button.querySelector(".tid-ved-kalender").textContent;
    time_nr = Object.keys(time_index).find(key => time_index[key] === time_content);

    if (category !== undefined) {
        if (["Ledig", "Available"].includes(button.querySelectorAll("span")[1].textContent)) {
            document.querySelector(".registrering").hidden = false;
            document.querySelector(".registrering").scrollIntoView();

            button.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.hidden = true;

            if (language === "no") {
                document.getElementById("r_title").textContent = category + " — " + day_index_no[day_nr]
                + " " + time_index[time_nr].split("-")[0].trim() + " (Uke " + week_nr + ")";
            } else if (language === "en") {
                document.getElementById("r_title").textContent = category + " — " + day_index_en[day_nr]
                + " " + time_index[time_nr].split("-")[0].trim() + " (Week " + week_nr + ")";
            }
        }
    } else {
        document.querySelector("#no-category").hidden = false;
        document.querySelector(".kalender").scrollIntoView();
    }
}

function kontaktSkjema() {
    skjemaType = "kontakt";

    document.querySelector(".registrering").hidden = false;
    document.querySelector(".registrering").scrollIntoView();
    document.querySelector('[class="wrap"]').hidden = true;

    if (language === "no") {
        document.getElementById("r_title").textContent = "Send oss en melding";
        document.getElementById("description").placeholder = "Melding (maks. 500 karakterer)";
    } else if (language === "en") {
        document.getElementById("r_title").textContent = "Send us a message";
        document.getElementById("description").placeholder = "Message (max. 500 characters)";
    }
    document.getElementById("description").maxLength = 500;
}

document.querySelectorAll('a[href^="#"], a[data-action^="#"], div[href^="#"], button[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
        if (link.hasAttribute("data-action")) {
            user_action = link.getAttribute("data-action").slice(1).replace("-", " ")
        } else {
            user_action = link.getAttribute("href").slice(1).replace("-", " ")
        }
        if (user_action === "T sendt" && skjemaType === "kontakt") {
            user_action_stable = "M sendt";
        }
        fetch("/api/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: user_action_stable !== undefined ? user_action_stable : user_action
            })
        });
        user_action_stable = undefined;
    });
});

async function change(step) {
    if (step === 1 && week_nr < 52) {
        week_nr++;
    }

    if (step === -1 && week_nr > get_week_nr()) {
        week_nr--;
    }

    set_week_display(week_nr);
    await update_availability();
    document.dispatchEvent(new Event("weekChanged"));
}

setInterval(async () => {
    await update_availability();
}, 10000);

function findTime(container, text) {
    return [...container.querySelectorAll(".tid-ved-kalender")].find(time => time.textContent.includes(text)) ?? null;
}

async function update_availability() {
    DontTouch = [];

    const response = await fetch("/api/cell-info-basic");
    const data = await response.json();

    for (const key of Object.keys(data)) {
        if (Number(key) === week_nr) {
            for (const list of data[key]) {
                const containingTime = findTime(document.querySelector(`#${CSS.escape(list[1])}`), time_index[list[0]]);
                if (containingTime !== null) {
                    const notAvailable = containingTime.parentElement.querySelectorAll("span")[1];
                    DontTouch.push(notAvailable);
                    if (language === "no") {
                        notAvailable.textContent = "Opptatt";
                    } else if (language === "en") {
                        notAvailable.textContent = "Unavailable";
                    }
                    notAvailable.className = "tm tm-opptatt";
                }
            }
        }
    }
    const opptattElements = document.querySelectorAll(".tm-opptatt");

    for (const opptattElement of opptattElements) {
        if (!DontTouch.includes(opptattElement)) {
            if (language === "no") {
                console.log(opptattElement.textContent);
                opptattElement.textContent = "Ledig";
            } else if (language === "en") {
                opptattElement.textContent = "Available";
            }
            opptattElement.className = "tm tm-ledig";
        }
    }
    DontTouch.length = 0;
}

function scrollTjenester(direction) {
    const element = document.querySelector(".ts-grid");

    if (direction === 'right') {
        element.scrollBy({
            left: 1,
            behavior: "smooth"
        })
    } else {
        element.scrollBy({
            left: -1,
            behavior: "smooth"
        })
    }
}

function selectLanguage() {
    if (document.documentElement.lang === "no") {
        language = "en";
    } else if (document.documentElement.lang === "en") {
        language = "no";
    }

    const active = document.querySelectorAll(".active-language");
    const inactive = document.querySelectorAll(".inactive-language");

    active.forEach(a => {a.className = "inactive-language";});
    inactive.forEach(i => {i.className = "active-language";});
}

function set_week_display(week_nr) {
    if (language === "no") {
        document.getElementById("week-display").textContent = "Uke\n" + week_nr;
    } else if (language === "en") {
        document.getElementById("week-display").textContent = "Week\n" + week_nr;
    }
}

const skjema_index = {
    "booking": "/api/cell-add",
    "kontakt": "/api/message-add"
};

const time_index = {
    "0": "09:00 - 09:20",
    "1": "09:20 - 09:40",
    "2": "09:40 - 10:00",
    "3": "10:00 - 10:20",
    "4": "10:20 - 10:40",
    "5": "10:40 - 11:00",
    "6": "11:00 - 11:20",
    "7": "11:20 - 11:40",
    "8": "11:40 - 12:00",
    "9": "12:00 - 12:20",
    "10": "12:20 - 12:40",
    "11": "12:40 - 13:00",
    "12": "13:00 - 13:20",
    "13": "13:20 - 13:40",
    "14": "13:40 - 14:00",
    "15": "14:00 - 14:20",
    "16": "14:20 - 14:40",
    "17": "14:40 - 15:00",
    "18": "15:00 - 15:20",
    "19": "15:20 - 15:40",
    "20": "15:40 - 16:00",
    "21": "16:00 - 16:20",
    "22": "16:20 - 16:40",
    "23": "16:40 - 17:00"
};

const day_index_no = {
    0: "Man.",
    1: "Tir.",
    2: "Ons.",
    3: "Tor.",
    4: "Fre.",
    5: "Lør.",
    6: "Søn."
};

const day_index_en = {
    0: "Mon.",
    1: "Tue.",
    2: "Wed.",
    3: "Thu.",
    4: "Fri.",
    5: "Sat.",
    6: "Sun."
};
