import abc

# Define an abstract base class
class ABCClass(abc.ABC):
    @abc.abstractmethod
    def do_something(self):
        pass

# Define concrete subclasses
class SubClassA(ABCClass):
    def do_something(self):
        print("SubClassA doing something")

class SubClassB(ABCClass):
    def do_something(self):
        print("SubClassB doing something")

class SubClassC(ABCClass):
    def do_something(self):
        print("SubClassC doing something")

class SubSubClassA(SubClassA):
    def do_something(self):
        print("SubSubClassA doing something")

# Function to get all subclasses, including indirect ones
def get_all_subclasses(cls):
    subclasses = set(cls.__subclasses__())
    for subclass in subclasses.copy():
        subclasses.update(get_all_subclasses(subclass))
    return subclasses

# Function to create instances of all subclasses
def create_instances_of_all_subclasses(base_class):
    subclasses = get_all_subclasses(base_class)
    instances = []
    for subclass in subclasses:
        instance = subclass()  # Create an instance of the subclass
        instances.append(instance)
        print(f"Created instance of {subclass.__name__}")
    return instances



if __name__ == '__main__':
    # Create instances of all subclasses of ABCClass
    instances = create_instances_of_all_subclasses(ABCClass)

    # Test the instances
    for instance in instances:
        instance.do_something()