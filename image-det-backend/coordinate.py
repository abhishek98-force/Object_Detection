class Coordinate:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def to_dict(self):
        return (self.x, self.y)