from flexx.pyscript import undefined, window

class Foo:
    a_constant = 1, 2, 3

    def ham(self, x):
        self.x = x

    def eggs(self, y):
        self.y = y * self.x
        hasattr(y, str)

class Bar(Foo):
    def bla(self, z):
        print(z)

if __name__ == "__main__":
    from flexx.pyscript import script2js
    script2js(__file__, 'example')