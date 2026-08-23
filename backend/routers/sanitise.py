import re

def strip_html(value: str) -> str:

    if not value:
        return value

    value = re.sub(r'<[^>]+>', '', value)

    value = value.replace('\x00', '')

    value = re.sub(r'\s+', ' ', value).strip()

    return value


def sanitise_goal_input(name: str = None, notes: str = None) -> tuple:

    clean_name  = strip_html(name)  if name  else name
    clean_notes = strip_html(notes) if notes else notes
    return clean_name, clean_notes