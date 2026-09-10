from utils.iterable_utils import IterableUtils


class TestBatch:

    def test_splits_into_batches_of_the_given_size(self):
        batches = list(IterableUtils.batch([1, 2, 3, 4, 5], 2))

        assert batches == [[1, 2], [3, 4], [5]]

    def test_returns_a_single_batch_when_smaller_than_the_batch_size(self):
        batches = list(IterableUtils.batch([1, 2], 500))

        assert batches == [[1, 2]]

    def test_returns_no_batches_for_an_empty_iterable(self):
        batches = list(IterableUtils.batch([], 500))

        assert batches == []

    def test_defaults_to_a_batch_size_of_one(self):
        batches = list(IterableUtils.batch([1, 2, 3]))

        assert batches == [[1], [2], [3]]
