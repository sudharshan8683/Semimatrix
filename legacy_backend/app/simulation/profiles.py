class ProcessProfile:
    def __init__(self, temp_nom, press_nom, vib_nom, cycle_nom):
        self.temp_nom = temp_nom
        self.press_nom = press_nom
        self.vib_nom = vib_nom
        self.cycle_nom = cycle_nom

PROFILES = {
    "ETCH": ProcessProfile(300.0, 2.0, 5.0, 60.0),
    "DEPOSITION": ProcessProfile(400.0, 1.5, 3.0, 90.0),
    "LITHOGRAPHY": ProcessProfile(22.0, 1.0, 1.0, 45.0),
    "CLEANING": ProcessProfile(50.0, 1.0, 2.0, 30.0),
    "ION_IMPLANT": ProcessProfile(80.0, 0.5, 4.0, 120.0),
    "METALLIZATION": ProcessProfile(250.0, 1.2, 3.5, 75.0),
    "INSPECTION": ProcessProfile(25.0, 1.0, 0.5, 20.0),
    "TESTING": ProcessProfile(25.0, 1.0, 0.5, 30.0),
}
